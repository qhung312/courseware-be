import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { UserRole } from "../models/user.model";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    SubjectService,
    MaterialService,
    FileUploadService,
} from "../services/index";
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { MaterialUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import { userMayUploadMaterial } from "../models/user.model";
import mongoose, { Types } from "mongoose";
import { toNumber } from "lodash";
import _ from "lodash";
import { logger } from "../lib/logger";

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

        this.router.get("/get/:docId", this.getById.bind(this));
        this.router.get("/download/:docId", this.download.bind(this));
        this.router.get("/get", this.getAvaliableMaterial.bind(this));
        this.router.get(
            "/getbysubject/:subjectId",
            this.getBySubject.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.patch("/edit/:docId", this.editMaterial.bind(this));
        this.router.delete("/delete/:docId", this.deleteById.bind(this));
        this.router.post("/create", fileUploader.any(), this.create.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const { name } = req.body;
            let { subject, chapter, subtitle, description } = req.body;
            if (!subtitle) subtitle = "";
            if (!description) description = "";

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
                await this.materialService.findOne({
                    subject: subject,
                    chapter: chapter,
                })
            ) {
                throw new Error(`This chapter already exists`);
            }

            const fileValidator = new UploadValidator(
                new MaterialUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            await this.subjectService.findOneAndUpdate(
                { _id: subject },
                {
                    lastUpdatedAt: Date.now(),
                }
            );
            const doc = await this.materialService.create(
                name,
                subtitle,
                description,
                subject,
                chapter,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression()
            );

            await session.commitTransaction();
            res.composer.success(doc);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getById(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userRole: UserRole = req.tokenMeta
                ? req.tokenMeta.role
                : UserRole.STUDENT;
            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
                _id: docId,
                readAccess: userRole,
            });
            if (!doc) {
                throw new Error(`Document not found`);
            }
            await session.commitTransaction();
            res.composer.success(doc);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getBySubject(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userRole: UserRole = req.tokenMeta
                ? req.tokenMeta.role
                : UserRole.STUDENT;
            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = await this.materialService.find({
                subject: subject,
                readAccess: userRole,
            });
            await session.commitTransaction();
            res.composer.success(ans);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async download(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userRole: UserRole = req.tokenMeta
                ? req.tokenMeta.role
                : UserRole.STUDENT;
            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
                _id: docId,
                readAccess: userRole,
            });
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource
            );
            await session.commitTransaction();
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${file.originalName}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getAvaliableMaterial(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userRole: UserRole = req.tokenMeta
                ? req.tokenMeta.role
                : UserRole.STUDENT;
            const ans = await this.materialService.find({
                readAccess: userRole,
            });
            await session.commitTransaction();
            res.composer.success(ans);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async editMaterial(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const userRole = req.tokenMeta.role;
            const doc = await this.materialService.findOne({
                _id: docId,
                writeAccess: userRole,
            });
            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }

            const info = _.pick(req.body, [
                "name",
                "subtitle",
                "description",
                "subject",
                "chapter",
                "readAccess",
                "writeAccess",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
                if (!(await this.subjectService.findById(info.subject))) {
                    throw new Error(`Subject doesn't exist`);
                }
            }
            if (info.chapter) {
                info.chapter = toNumber(info.chapter);
            }
            if (info.readAccess) {
                const ra: UserRole[] = info.readAccess;
                if (!ra.every((r) => Object.values(UserRole).includes(r))) {
                    throw new Error(`Read access contains unrecognized role`);
                }
                if (
                    doc.readAccess.includes(userRole) &&
                    !ra.includes(userRole)
                ) {
                    throw new Error(
                        `You cannot remove your own role's read access to this document`
                    );
                }
            }
            if (info.writeAccess) {
                const wa: UserRole[] = info.writeAccess;
                if (!wa.every((r) => Object.values(UserRole).includes(r))) {
                    throw new Error(`Write access contains unrecognized role`);
                }
                if (
                    doc.writeAccess.includes(userRole) &&
                    !wa.includes(userRole)
                ) {
                    throw new Error(
                        `You cannot remove your own role's write access to this document`
                    );
                }
            }
            // subject must be empty or valid, so we check if it collides with any other document
            const changedLoc =
                (info.subject && info.subject != doc.subject) ||
                (info.chapter && info.chapter != doc.chapter);
            if (changedLoc) {
                const nSubject = info.subject ? info.subject : doc.subject;
                const nChapter = info.chapter ? info.chapter : doc.chapter;
                if (
                    await this.materialService.findOne({
                        subject: nSubject,
                        chapter: nChapter,
                    })
                ) {
                    throw new Error(
                        `A document with the same subject and chapter id already exists`
                    );
                }
            }

            await this.materialService.findOneAndUpdate(
                { _id: docId },
                {
                    ...info,
                    lastUpdatedAt: Date.now(),
                }
            );
            await session.commitTransaction();
            res.composer.success(true);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async deleteById(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userRole = req.tokenMeta.role;
            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.materialService.findOne({
                _id: docId,
                writeAccess: userRole,
            });
            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
            }

            await this.materialService.deleteById(docId);
            await session.commitTransaction();
            res.composer.success(true);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }
}
