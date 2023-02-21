import { FilterQuery, Model, PipelineStage } from 'mongoose';

interface IQuery {
    limit: number;
    page: number;
    sortBy: string;
    sortOrder: 'desc' | 'asc';
}

export enum SortOrder {
    desc = -1,
    asc = 1,
}

export class DbController<T> {
    private model: Model<T>;
    constructor(model: Model<T>) {
        this.model = model;
    }

    getOne = (filter: FilterQuery<T>, select = '-__v') => this.model.findOne(filter, select).lean();

    count = (filter: FilterQuery<T>) => this.model.count(filter).lean();

    exists = (filter: FilterQuery<T>) => this.model.exists(filter).lean();

    getAll = (filter: FilterQuery<T> = {}, select = '-__v') => this.model.find(filter, select).lean();

    getWithQuery = (filter: FilterQuery<T> = {}, query: IQuery, select = '-__v') => {
        return this.model
            .find(filter, select)
            .skip((query.page - 1) * query.limit)
            .limit(query.limit)
            .sort({
                [query.sortBy]: SortOrder[query.sortOrder],
            })
            .lean();
    };

    create = (details: FilterQuery<T>) => this.model.create(details);

    updateOne = (filter: FilterQuery<T>, details: object) => this.model.updateOne(filter, details).lean();

    deleteOne = (filter: FilterQuery<T>) => this.model.deleteOne(filter).lean();

    aggregate = (pipeline: PipelineStage[]) => this.model.aggregate<T>(pipeline);
}
