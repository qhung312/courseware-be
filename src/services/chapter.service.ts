import { injectable } from "inversify";
import { logger } from "../lib/logger";
import {
    FilterQuery,
    PopulateOptions,
    ProjectionType,
    QueryOptions,
    Types,
    UpdateQuery,
} from "mongoose";
import ChapterModel, { ChapterDocument } from "../models/chapter.model";
import _ from "lodash";

@injectable()
export class ChapterService {
    constructor() {
        logger.info("[Chapter] Initializing...");
    }

    async create(
        name: string,
        subject: Types.ObjectId,
        description: string,
        userId: Types.ObjectId
    ) {
        const now = Date.now();
        return await ChapterModel.create({
            name: name,
            description: description,
            subject: subject,
            createdBy: userId,
            createdAt: now,
            lastUpdatedAt: now,
        });
    }

    async editOneChapter(
        id: Types.ObjectId,
        update: UpdateQuery<ChapterDocument> = {},
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.findOneAndUpdate(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            { ...update, lastupdatedAt: Date.now() },
            { ...options, new: true }
        );
    }

    async markAsDeleted(
        id: Types.ObjectId,
        options: QueryOptions<ChapterDocument> = {}
    ) {
        return await ChapterModel.findOneAndUpdate(
            {
                _id: id,
            },
            {
                deletedAt: Date.now(),
            },
            { ...options, new: true }
        );
    }

    async chapterWithSubjectExists(subject: Types.ObjectId) {
        return (
            (await ChapterModel.findOne({
                subject: subject,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async isChildOfSubject(
        chapterId: Types.ObjectId,
        subjectId: Types.ObjectId
    ) {
        return (
            (await ChapterModel.findOne({
                _id: chapterId,
                subject: subjectId,
                deletedAt: { $exists: false },
            })) != null
        );
    }

    async getByIdPopulated(
        id: Types.ObjectId,
        projection: ProjectionType<ChapterDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await ChapterModel.findOne(
            {
                _id: id,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(populateOptions);
    }

    async getPaginated(
        query: FilterQuery<ChapterDocument>,
        projection: ProjectionType<ChapterDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[],
        pageSize: number,
        pageNumber: number
    ) {
        return await Promise.all([
            ChapterModel.count({
                ...query,
                deletedAt: { $exists: false },
            }),
            ChapterModel.find(
                {
                    ...query,
                    deletedAt: { $exists: false },
                },
                projection
            )
                .skip(Math.max(pageSize * (pageNumber - 1), 0))
                .limit(pageSize)
                .populate(populateOptions),
        ]);
    }

    async getPopulated(
        query: FilterQuery<ChapterDocument>,
        projection: ProjectionType<ChapterDocument>,
        populateOptions: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return await ChapterModel.find(
            {
                ...query,
                deletedAt: { $exists: false },
            },
            projection
        ).populate(populateOptions);
    }
}
