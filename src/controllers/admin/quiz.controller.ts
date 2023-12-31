import { inject, injectable } from "inversify";
import { Controller } from "../controller";
import { Request, Response, ServiceType } from "../../types";
import {
    AccessLevelService,
    AuthService,
    ChapterService,
    QuestionService,
    QuizService,
    SubjectService,
} from "../../services/index";
import { Router } from "express";
import { Permission } from "../../models/access_level.model";
import { CreateQuizDto } from "../../lib/dto";
import { FilterQuery, Types } from "mongoose";
import { logger } from "../../lib/logger";
import { QuizDocument } from "../../models/quiz.model";
import { DEFAULT_PAGINATION_SIZE } from "../../config";
import _ from "lodash";
import { EditQuizDto } from "../../lib/dto/edit_quiz.dto";

@injectable()
export class AdminQuizController extends Controller {
    public readonly path = "/quiz";
    public readonly router = Router();

    constructor(
        @inject(ServiceType.Auth) private authService: AuthService,
        @inject(ServiceType.Quiz) private quizService: QuizService,
        @inject(ServiceType.AccessLevel)
        private accessLevelService: AccessLevelService,
        @inject(ServiceType.Subject) private subjectService: SubjectService,
        @inject(ServiceType.Question) private questionService: QuestionService,
        @inject(ServiceType.Chapter) private chapterService: ChapterService
    ) {
        super();

        this.router.all("*", authService.authenticate());

        this.router.post("/", this.create.bind(this));
        this.router.delete("/:quizId", this.delete.bind(this));
        this.router.get("/", this.getAll.bind(this));
        this.router.get("/:quizId", this.getById.bind(this));
        this.router.patch("/:quizId", this.edit.bind(this));
    }

    async create(req: Request, res: Response) {
        try {
            const userId = req.tokenMeta.userId;
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canCreate = await canPerform(Permission.AMDIN_CREATE_QUIZ);
            if (!canCreate) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const info: CreateQuizDto = {
                name: req.body.name || "",
                description: req.body.description || "",
                subject: new Types.ObjectId(req.body.subject),
                chapter: new Types.ObjectId(req.body.chapter),
                duration: req.body.duration,
                potentialQuestions: (
                    req.body.potentialQuestions as string[]
                ).map((question) => new Types.ObjectId(question)),
                sampleSize: req.body.sampleSize,
            };

            const subjectExists = await this.subjectService.subjectExists(
                info.subject
            );
            if (!subjectExists) {
                throw new Error(`Subject doesn't exist`);
            }
            if (
                !(await this.chapterService.isChildOfSubject(
                    info.chapter,
                    info.subject
                ))
            ) {
                throw new Error(
                    `Chapter does not exist or is not a child of the subject`
                );
            }
            // check that all questions are unique
            const duplicateQuestions = info.potentialQuestions.some(
                (question, index) =>
                    info.potentialQuestions.some(
                        (otherQuestion, otherIndex) =>
                            question.equals(otherQuestion) &&
                            index !== otherIndex
                    )
            );
            if (duplicateQuestions) {
                throw new Error(`One or more questions are duplicated`);
            }
            if (
                info.sampleSize <= 0 ||
                info.sampleSize > info.potentialQuestions.length
            ) {
                throw new Error(`Sample size is invalid`);
            }
            const questionExists = await this.questionService.questionExists(
                info.potentialQuestions
            );
            if (!questionExists) {
                throw new Error(`One or more questions does not exist`);
            }

            const result = await this.quizService.create(userId, req.body);
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.VIEW_QUIZ);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const query: FilterQuery<QuizDocument> = {};

            if (req.query.name) {
                query.name = {
                    $regex: decodeURIComponent(req.query.name as string),
                };
            }
            if (req.query.subject) {
                query.subject = new Types.ObjectId(req.query.subject as string);
            }
            if (req.query.chapter) {
                query.chapter = new Types.ObjectId(req.query.chapter as string);
            }

            const pageSize: number = req.query.pageSize
                ? parseInt(req.query.pageSize as string)
                : DEFAULT_PAGINATION_SIZE;
            const pageNumber: number = req.query.pageNumber
                ? parseInt(req.query.pageNumber as string)
                : 1;

            const hiddenFields = [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
                "chapter.__v",
                "chapter.createdAt",
                "chapter.createdBy",
                "chapter.lastUpdatedAt",
            ];

            if (req.query.pagination === "false") {
                const result = (
                    await this.quizService.getPopulated(
                        query,
                        {
                            __v: 0,
                            potentialQuestions: 0,
                        },
                        ["subject", "chapter"]
                    )
                ).map((quiz) => _.omit(quiz.toObject(), hiddenFields));
                res.composer.success({
                    total: result.length,
                    result,
                });
            } else {
                const [total, unmappedResult] =
                    await this.quizService.getPaginated(
                        query,
                        {
                            __v: 0,
                            potentialQuestions: 0,
                        },
                        ["subject", "chapter"],
                        pageSize,
                        pageNumber
                    );

                const result = unmappedResult.map((quiz) =>
                    _.omit(quiz.toObject(), hiddenFields)
                );

                res.composer.success({
                    total,
                    pageCount: Math.max(Math.ceil(total / pageSize), 1),
                    pageSize,
                    result,
                });
            }
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canDelete = await canPerform(Permission.ADMIN_DELETE_QUIZ);
            if (!canDelete) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizId = new Types.ObjectId(req.params.quizId);

            const quiz = await this.quizService.getQuizById(quizId);

            if (!quiz) {
                throw new Error(`Quiz not found`);
            }

            // if we delete a quiz, all quizzes that were created from it
            // still exist, and can be viewed by the user
            const result = await this.quizService.markAsDeleted(quizId);
            if (!result) {
                throw new Error(`Quiz not found`);
            }
            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canView = await canPerform(Permission.ADMIN_VIEW_QUIZ);
            if (!canView) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizId = new Types.ObjectId(req.params.quizId);
            const quiz = await this.quizService.getByIdPopulated(
                quizId,
                {
                    __v: 0,
                },
                [
                    { path: "subject" },
                    { path: "chapter" },
                    {
                        path: "potentialQuestions",
                        populate: [{ path: "subject" }, { path: "chapter" }],
                    },
                ]
            );

            if (!quiz) {
                throw new Error(`Quiz not found`);
            }

            const result = _.omit(quiz.toObject(), [
                "subject.__v",
                "subject.createdAt",
                "subject.createdBy",
                "subject.lastUpdatedAt",
                "chapter.__v",
                "chapter.createdAt",
                "chapter.createdBy",
                "chapter.lastUpdatedAt",
                "potentialQuestions.__v",
            ]);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }

    async edit(req: Request, res: Response) {
        try {
            const canPerform = this.accessLevelService.permissionChecker(
                req.tokenMeta
            );
            const canEdit = await canPerform(Permission.ADMIN_EDIT_QUIZ);
            if (!canEdit) {
                throw new Error(
                    `Your role(s) does not have the permission to perform this action`
                );
            }

            const quizId = new Types.ObjectId(req.params.quizId);
            const quiz = await this.quizService.getQuizById(quizId);

            if (!quiz) {
                throw new Error(`Quiz not found`);
            }

            const info: EditQuizDto = {
                name: req.body.name ?? quiz.name,
                description: req.body.description ?? quiz.description,
                subject: req.body.subject
                    ? new Types.ObjectId(req.body.subject)
                    : quiz.subject,
                chapter: req.body.chapter
                    ? new Types.ObjectId(req.body.chapter)
                    : quiz.chapter,

                duration: req.body.duration ?? quiz.duration,
                potentialQuestions: req.body.potentialQuestions
                    ? (req.body.potentialQuestions as string[]).map(
                          (questionId) => new Types.ObjectId(questionId)
                      )
                    : quiz.potentialQuestions,
                sampleSize: req.body.sampleSize ?? quiz.sampleSize,
                isHidden: req.body.isHidden ?? quiz.isHidden,
            };

            const chapterIsChildOfSubject =
                await this.chapterService.isChildOfSubject(
                    info.chapter,
                    info.subject
                );
            if (!chapterIsChildOfSubject) {
                throw new Error(`Chapter doesn't belong to subject`);
            }

            const validDuration = info.duration > 0;
            if (!validDuration) {
                throw new Error(`Duration must be posititve`);
            }

            const questionsEmpty = info.potentialQuestions.length === 0;
            if (questionsEmpty) {
                throw new Error(`Potential questions cannot be empty`);
            }

            const questionsExists = await this.questionService.questionExists(
                info.potentialQuestions
            );
            if (!questionsExists) {
                throw new Error(`One or more questions doesn't exist`);
            }

            const questionDuplicate = info.potentialQuestions.some(
                (question, index) =>
                    info.potentialQuestions.some(
                        (otherQuestion, otherIndex) =>
                            question.equals(otherQuestion) &&
                            index !== otherIndex
                    )
            );
            if (questionDuplicate) {
                throw new Error(`Found duplicate questions`);
            }

            const validSampleSize =
                info.sampleSize > 0 &&
                info.sampleSize <= info.potentialQuestions.length;
            if (!validSampleSize) {
                throw new Error(
                    `Sample size must be between 1 and ${info.potentialQuestions.length}`
                );
            }

            const result = await this.quizService.edit(quizId, info);

            res.composer.success(result);
        } catch (error) {
            logger.error(error.message);
            console.log(error);
            res.composer.badRequest(error.message);
        }
    }
}
