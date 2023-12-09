import { inject, injectable } from "inversify";
import { Controller } from "./controller";
import { Router } from "express";
import { Request, Response, ServiceType } from "../types";
import {
    AccessLevelService,
    AuthService,
    QuestionTemplateService,
    QuizTemplateService,
    SubjectService,
} from "../services/index";
import mongoose, { Types } from "mongoose";
import { logger } from "../lib/logger";
import { Permission } from "../models/access_level.model";
import _, { sample, sampleSize } from "lodash";

@injectable()
export class QuizTemplateController extends Controller {
    public readonly router = Router();
    public readonly path = "/quiz_template";

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.QuizTemplate)
        private quizTemplateService: QuizTemplateService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.QuestionTemplate)
        private questionTemplateService: QuestionTemplateService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/", this.create.bind(this));
    }

    async create(req: Request, res: Response) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userAccessLevels = req.tokenMeta.accessLevels;
            const userId = req.tokenMeta.userId;

            if (
                !(await this.accessLevelService.accessLevelsCanPerformAction(
                    userAccessLevels,
                    Permission.CREATE_QUIZ_TEMPLATE,
                    req.tokenMeta.isManager
                ))
            ) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            req.body = _.pick(req.body, [
                "name",
                "description",
                "subject",
                "visibleTo",
                "duration",
                "potentialQuestions",
                "sampleSize",
            ]);
            const [subject, levels, questions, sampleSize] = [
                req.body.subject as Types.ObjectId,
                (req.body.visibleTo as string[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                (req.body.potentialQuestions as string[]).map(
                    (x) => new Types.ObjectId(x)
                ),
                req.body.sampleSize as number,
            ];
            if (!(await this.subjectService.findById(subject))) {
                throw new Error(`Subject doesn't exist`);
            }
            if (!(await this.accessLevelService.accessLevelsExist(levels))) {
                throw new Error(`One or more access levels does not exist`);
            }
            if (sampleSize <= 0 || sampleSize > questions.length) {
                throw new Error(`Sample size is invalid`);
            }
            if (
                !(await this.questionTemplateService.questionTemplatesExist(
                    questions
                ))
            ) {
                throw new Error(`One or more questions does not exist`);
            }

            const result = await this.quizTemplateService.create(
                userId,
                req.body
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
}
