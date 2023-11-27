import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import { AuthService } from "../services";
import { SubjectService } from "../services/subject.service";
import { MaterialService } from "../services/material.service";
import { FileUploadService } from "../services/file-upload.service";
import { fileUploader } from "../upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { userMayUploadMaterial } from "../models/user.model";
import { Types } from "mongoose";
import { toNumber } from "lodash";

@injectable()
export class MaterialController extends Controller {
    public readonly router = Router();
    public readonly path = "/material";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Material) private materialService: MaterialService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService
    ) {
        super();
        this.router.all("*", this.authService.authenticate());

        this.router.post("/create", fileUploader.any(), this.create.bind(this));
        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId/:index", this.download.bind(this));
        this.router.get("/get", this.getAvaliableMaterial.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );
    }

    async create(req: Request, res: Response) {
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject, chapter } = req.body;

            if (!userMayUploadMaterial(req.tokenMeta.role)) {
                throw new Error(
                    `You don't have the permission required to upload material`
                );
            }
            if (!name) {
                throw new Error(`Missing 'name' field`);
            }
            if (!subject) {
                throw new Error(`Missing 'subject' field`);
            }
            if (!chapter) {
                throw new Error(`Missing 'chapter' field`);
            }
            subject = new Types.ObjectId(subject);
            chapter = toNumber(chapter);

            if (!(await this.subjectService.findById(subject))) {
                throw new Error(`Subject doesn't exist`);
            }

            if (
                (
                    await this.materialService.find({
                        subject: subject,
                        chapter: chapter,
                    })
                ).length > 0
            ) {
                throw new Error(`This chapter already exists`);
            }

            const fileValidator = new UploadValidator(
                new MaterialUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            await this.subjectService.update(subject, {
                lastUpdatedAt: Date.now(),
            });
            const doc = await this.materialService.create(
                name,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const doc = (
                await this.materialService.find({
                    _id: docId,
                    readAccess: req.tokenMeta.role,
                })
            )[0];
            if (!doc) {
                throw new Error(`Document not found`);
            }
            res.composer.success(doc);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getBySubject(req: Request, res: Response) {
        try {
            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = await this.materialService.find({
                subject: subject,
                readAccess: req.tokenMeta.role,
            });
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async download(req: Request, res: Response) {
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const index = toNumber(req.params.index);
            const doc = (
                await this.materialService.find({
                    _id: docId,
                    readAccess: req.tokenMeta.role,
                })
            )[0];
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }
            if (index < 0 || index >= doc.resource.length) {
                throw new Error(`Invalid index`);
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource[index]
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${file.originalName}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAvaliableMaterial(req: Request, res: Response) {
        try {
            const role = req.tokenMeta.role;
            const ans = await this.materialService.find({
                readAccess: role,
            });
            res.composer.success(ans);
        } catch (error) {
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
