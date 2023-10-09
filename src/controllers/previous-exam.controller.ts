import { inject, injectable } from "inversify";
import { Router } from "express";
import { Controller } from "./controller";
import { Request, Response, ServiceType } from "../types";
import {
    AuthService,
    PreviousExamService,
    FileUploadService,
    SubjectService,
    AccessLevelService,
} from "../services/index";
import { fileUploader } from "../lib/upload-storage";
import { AgressiveFileCompression } from "../lib/file-compression/strategies";
import { UploadValidator } from "../lib/upload-validator/upload-validator";
import { PreviousExamUploadValidation } from "../lib/upload-validator/upload-validator-strategies";
import mongoose, { Types } from "mongoose";
import _ from "lodash";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";

@injectable()
export class PreviousExamController extends Controller {
    public readonly router = Router();
    public readonly path = "/previous-exams";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.PreviousExam)
        private previousExamService: PreviousExamService,
        @inject(ServiceType.FileUpload)
        private fileUploadService: FileUploadService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService
    ) {
        super();

        this.router.get(
            "/:docId",
            authService.authenticate(false),
            this.getById.bind(this)
        );
        this.router.get(
            "/download/:docId",
            authService.authenticate(false),
            this.download.bind(this)
        );
        this.router.get(
            "/",
            authService.authenticate(false),
            this.getAvailable.bind(this)
        );
        this.router.get(
            "/subject/:subjectId",
            authService.authenticate(false),
            this.getBySubject.bind(this)
        );

        this.router.all("*", authService.authenticate());
        this.router.post("/", fileUploader.any(), this.create.bind(this));
        this.router.patch("/:docId", this.edit.bind(this));
        this.router.delete("/:docId", this.delete.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { userId } = req.tokenMeta;
            const {
                name,
                subject: subjectString,
                subtitle = "",
                description = "",
            } = req.body;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    req.tokenMeta.accessLevels,
                    Permission.UPLOAD_PREVIOUS_EXAM,
                    req.tokenMeta.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            if (!name) {
                throw new Error(`Missing 'name' field`);
            }
            if (!subjectString) {
                throw new Error(`Missing 'subject' field`);
            }
            const subject = new Types.ObjectId(subjectString);

            if (
                !(await this.subjectService.findById(
                    subject,
                    {},
                    { session: session }
                ))
            ) {
                throw new Error(`Subject doesn't exist`);
            }

            const fileValidator = new UploadValidator(
                new PreviousExamUploadValidation()
            );
            fileValidator.validate(req.files as Express.Multer.File[]);

            await this.subjectService.findOneAndUpdate(
                { _id: subject },
                {
                    lastUpdatedAt: Date.now(),
                },
                {
                    session: session,
                }
            );

            if (!req.body.visibleTo) {
                throw new Error(`Missing 'visibleTo' field`);
            }
            const visibleTo = (JSON.parse(req.body.visibleTo) as string[]).map(
                (x) => new Types.ObjectId(x)
            );
            if (
                !(await this.accessLevelService.accessLevelsExist(visibleTo, {
                    session: session,
                }))
            ) {
                throw new Error(`One or more access levels does not exist`);
            }

            const doc = await this.previousExamService.create(
                name,
                subtitle,
                description,
                subject,
                userId,
                req.files as Express.Multer.File[],
                new AgressiveFileCompression(),
                visibleTo,
                { session: session }
            );

            res.composer.success(doc);
            await session.commitTransaction();
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
            const userAccessLevels = req.tokenMeta?.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.findOne(
                {
                    _id: docId,
                },
                {},
                { session: session }
            );
            if (!doc) {
                throw new Error(`Document not found`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta?.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }
            res.composer.success(doc);
            await session.commitTransaction();
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
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const subject = new Types.ObjectId(req.params.subjectId);
            const ans = (
                await this.previousExamService.find(
                    {
                        subject: subject,
                    },
                    {},
                    { session: session }
                )
            ).filter((d) =>
                this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    d.visibleTo,
                    req.tokenMeta?.isManager
                )
            );
            res.composer.success(ans);
            await session.commitTransaction();
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
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.findOne(
                {
                    _id: docId,
                },
                {},
                { session: session }
            );
            if (!doc) {
                throw new Error(`Document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta?.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            const file = await this.fileUploadService.downloadFile(
                doc.resource,
                { session: session }
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${encodeURI(file.originalName)}`
            );
            res.setHeader("Content-Type", `${file.mimetype}`);
            res.end(file.buffer);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async getAvailable(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta?.accessLevels;
            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.VIEW_PREVIOUS_EXAM,
                    req.tokenMeta?.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const ans = (
                await this.previousExamService.find(
                    {},
                    {},
                    { session: session }
                )
            ).filter((d) =>
                this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    d.visibleTo,
                    req.tokenMeta?.isManager
                )
            );
            res.composer.success(ans);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async edit(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const docId = new Types.ObjectId(req.params.docId);
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.EDIT_PREVIOUS_EXAM,
                    req.tokenMeta.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const doc = await this.previousExamService.findOne(
                {
                    _id: docId,
                },
                {},
                { session: session }
            );
            if (!doc) {
                throw new Error(`The required document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            const info = _.pick(req.body, [
                "name",
                "subtitle",
                "description",
                "subject",
                "visibleTo",
            ]);

            if (info.subject) {
                info.subject = new Types.ObjectId(info.subject);
            }
            if (info.visibleTo) {
                info.visibleTo = (info.visibleTo as string[]).map(
                    (x) => new Types.ObjectId(x)
                );
                if (
                    !(await this.accessLevelService.accessLevelsExist(
                        info.visibleTo,
                        { session: session }
                    ))
                ) {
                    throw new Error(`One or more access levels don't exist`);
                }
            }
            if (info.subject) {
                const subject = new Types.ObjectId(info.subject);
                if (
                    !this.subjectService.findById(
                        subject,
                        {},
                        { session: session }
                    )
                ) {
                    throw new Error(`Subject doesn't exist`);
                }
            }

            const result = await this.previousExamService.findOneAndUpdate(
                { _id: docId },
                {
                    ...info,
                    lastUpdatedAt: Date.now(),
                },
                {
                    new: true,
                    session: session,
                }
            );
            res.composer.success(result);
            await session.commitTransaction();
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            await session.abortTransaction();
            res.composer.badRequest(error.message);
        } finally {
            await session.endSession();
        }
    }

    async delete(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.DELETE_PREVIOUS_EXAM,
                    req.tokenMeta.isManager,
                    { session: session }
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const docId = new Types.ObjectId(req.params.docId);
            const doc = await this.previousExamService.findOne(
                {
                    _id: docId,
                },
                {},
                { session: session }
            );
            if (!doc) {
                throw new Error(`Requested document doesn't exist`);
            }
            if (
                !this.accessLevelService.accessLevelsOverlapWithAllowedList(
                    userAccessLevels,
                    doc.visibleTo,
                    req.tokenMeta.isManager
                )
            ) {
                throw new Error(
                    `This document has been configured to be hidden from you`
                );
            }

            const result = await this.previousExamService.deleteById(docId, {
                session: session,
            });
            res.composer.success(result);
            await session.commitTransaction();
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
