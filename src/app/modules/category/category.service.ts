import { redisClient } from "../../../config/redis.client";
import { RedisHelper } from "../../../helpers/redisHelper";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategoryIntoDB = async (data:ICategory) => {
    const category = await Category.create(data);
    await RedisHelper.keyDelete('category');
    await redisClient.del('category');
    return category;
};

const getAllCategoryFromDB = async () => {
    const categories = await Category.find({});
    await RedisHelper.redisSet('category',categories,{},1000000);
    return categories;
};

const updateCategoryIntoDB = async (id: string, data: ICategory) => {
    const category = await Category.findOneAndUpdate({ _id: id }, data, {
        new: true,
    });
    await RedisHelper.keyDelete('category');
    await redisClient.del('category');
    return category;
};

const deleteCategoryFromDB = async (id: string) => {
    const category = await Category.findOneAndDelete({ _id: id });
    await RedisHelper.keyDelete('category');
    await redisClient.del('category');
    return category;
};

export const CategoryService = {
    createCategoryIntoDB,
    getAllCategoryFromDB,
    updateCategoryIntoDB,
    deleteCategoryFromDB,
};