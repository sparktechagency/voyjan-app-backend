import { redisClient } from "../../../config/redis.client";
import { RedisHelper } from "../../../helpers/redisHelper";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategoryIntoDB = async (data:ICategory) => {
    const category = await Category.create(data);
    return category;
};

const getAllCategoryFromDB = async () => {
    const categories = await Category.find({});
    return categories;
};

const updateCategoryIntoDB = async (id: string, data: ICategory) => {
    const category = await Category.findOneAndUpdate({ _id: id }, data, {
        new: true,
    });
    return category;
};

const deleteCategoryFromDB = async (id: string) => {
    const category = await Category.findOneAndDelete({ _id: id });
    return category;
};

export const CategoryService = {
    createCategoryIntoDB,
    getAllCategoryFromDB,
    updateCategoryIntoDB,
    deleteCategoryFromDB,
};