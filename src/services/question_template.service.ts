import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    ProjectionType,
    QueryOptions,
    SaveOptions,
    Types,
} from "mongoose";
import QuestionTemplateModel, {
    ConcreteQuestion,
    QuestionTemplateDocument,
    QuestionType,
} from "../models/question_template.model";
import { CharStream, CommonTokenStream } from "antlr4";
import GrammarLexer from "../lib/question-generation/GrammarLexer";
import GrammarParser from "../lib/question-generation/GrammarParser";
import QuestionGrammarVisitor from "../lib/question-generation/QuestionGrammarVisitor";
import Mustache from "mustache";
import _ from "lodash";
import { QuizDocument } from "../models/quiz.model";

@injectable()
export class QuestionTemplateService {
    constructor() {
        logger.info("[QuestionTemplate] Initializing...");
    }

    async create(userId: Types.ObjectId, data: any, options: SaveOptions = {}) {
        /**
         * data should include metadata (as indicated by the model)
         * except createdBy and createdAt (automatically generated)
         */
        return (
            await QuestionTemplateModel.create(
                [
                    {
                        ...data,
                        createdAt: Date.now(),
                        createdBy: userId,
                    },
                ],
                options
            )
        )[0];
    }

    generateConcreteQuestion(questionTemplate: QuestionTemplateDocument) {
        const result: ConcreteQuestion = {
            questions: [],
        };

        const charStream = new CharStream(questionTemplate.code);
        const lexer = new GrammarLexer(charStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new GrammarParser(tokenStream);
        const visitor = new QuestionGrammarVisitor();

        visitor.visitProg(parser.prog());
        const symbols = Object.fromEntries(visitor.getSymbols());

        if (questionTemplate.description !== undefined) {
            result.description = Mustache.render(
                questionTemplate.description,
                symbols
            );
        }

        for (const question of questionTemplate.questions) {
            switch (question.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKey: question.answerKey,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        options: _.shuffle(
                            question.options.map((opt) => ({
                                description: Mustache.render(
                                    opt.description,
                                    symbols
                                ),
                                key: opt.key,
                            }))
                        ),
                        answerKeys: question.answerKeys,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.NUMBER: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: parseFloat(
                            Mustache.render(question.answerField, symbols)
                        ),
                        maximumError: question.maximumError,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                case QuestionType.TEXT: {
                    result.questions.push({
                        questionType: question.questionType,
                        description: Mustache.render(
                            question.description,
                            symbols
                        ),
                        answerField: Mustache.render(
                            question.answerField,
                            symbols
                        ),
                        matchCase: question.matchCase,
                        explanation: Mustache.render(
                            question.explanation,
                            symbols
                        ),
                        isCorrect: false,
                    });
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question option: ${question.questionType}`
                    );
                }
            }
        }

        return result;
    }

    /**
     * Checks if the saved answer of a question is correct, and updates
     * the question object accordingly
     */
    processQuestionAnswer(question: ConcreteQuestion) {
        for (const subQuestion of question.questions) {
            switch (subQuestion.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (subQuestion.userAnswerKey !== undefined) {
                        subQuestion.isCorrect =
                            subQuestion.userAnswerKey === subQuestion.answerKey;
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (subQuestion.userAnswerKeys !== undefined) {
                        subQuestion.isCorrect = _.isEqual(
                            subQuestion.userAnswerKeys.sort(),
                            subQuestion.answerKeys.sort()
                        );
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (subQuestion.userAnswerField !== undefined) {
                        subQuestion.isCorrect =
                            Math.abs(
                                (subQuestion.userAnswerField as number) -
                                    (subQuestion.answerField as number)
                            ) <= subQuestion.maximumError;
                    }
                    break;
                }
                case QuestionType.TEXT: {
                    if (subQuestion.userAnswerField !== undefined) {
                        subQuestion.isCorrect = subQuestion.matchCase
                            ? (subQuestion.userAnswerField as string) ===
                              (subQuestion.answerField as string)
                            : (
                                  subQuestion.userAnswerField as string
                              ).toLowerCase() ===
                              (subQuestion.answerField as string).toLowerCase();
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question type: ${subQuestion.questionType}`
                    );
                }
            }
        }
    }

    /**
     * Attaches the user's answers to the question object
     */
    attachUserAnswerToQuestion(question: ConcreteQuestion, answers: any[]) {
        for (const [index, subQuestion] of question.questions.entries()) {
            const answer = answers[index];
            switch (subQuestion.questionType) {
                case QuestionType.MULTIPLE_CHOICE_SINGLE_ANSWER: {
                    if (answer.answerKey !== undefined) {
                        subQuestion.userAnswerKey = answer.answerKey as number;
                    }
                    break;
                }
                case QuestionType.MULTIPLE_CHOICE_MULTIPLE_ANSWERS: {
                    if (answer.answerKeys !== undefined) {
                        subQuestion.userAnswerKeys =
                            answer.answerKeys as number[];
                    }
                    break;
                }
                case QuestionType.NUMBER: {
                    if (answer.answerField !== undefined) {
                        subQuestion.userAnswerField =
                            answer.answerField as number;
                    }
                    break;
                }
                case QuestionType.TEXT: {
                    if (answer.answerField !== undefined) {
                        subQuestion.userAnswerField =
                            answer.answerField as string;
                    }
                    break;
                }
                default: {
                    throw new Error(
                        `Unrecognized question type: ${subQuestion.questionType}`
                    );
                }
            }
        }
    }

    async questionTemplatesExist(
        questions: Types.ObjectId[],
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        const result = await Promise.all(
            questions.map((question) =>
                (async () => {
                    return (
                        (await QuestionTemplateModel.findOne(
                            { _id: question, deletedAt: { $exists: false } },
                            {},
                            options
                        )) != null
                    );
                })()
            )
        );
        return result.every((x) => x);
    }

    async findOne(
        query: FilterQuery<QuestionTemplateDocument>,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return QuestionTemplateModel.findOne(query, projection, options);
    }

    async deleteOne(
        query: FilterQuery<QuestionTemplateDocument>,
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.deleteOne(query, options);
    }

    async markAsDeleted(id: Types.ObjectId) {
        return await QuestionTemplateModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: Date.now() },
            { new: true }
        );
    }

    async find(
        query: FilterQuery<QuestionTemplateDocument>,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.find(query, projection, options);
    }

    async findById(
        id: Types.ObjectId,
        projection: ProjectionType<QuestionTemplateDocument> = {},
        options: QueryOptions<QuestionTemplateDocument> = {}
    ) {
        return await QuestionTemplateModel.findById(id, projection, options);
    }
}
