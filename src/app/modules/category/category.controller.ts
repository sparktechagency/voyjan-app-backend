import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { CategoryService } from "./category.service";
import sendResponse from "../../../shared/sendResponse";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const createdCategory = await CategoryService.createCategoryIntoDB(req.body);
    sendResponse(res, {
        success: true,
        message: 'Category created successfully',
        data: createdCategory,
        statusCode: 200,
    });
});

const getAllCategory = catchAsync(async (req: Request, res: Response) => {
    const createdCategory = await CategoryService.getAllCategoryFromDB();
    sendResponse(res, {
        success: true,
        message: 'Category fetch successfully',
        data: createdCategory,
        statusCode: 200,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const createdCategory = await CategoryService.updateCategoryIntoDB(req.params.id, req.body);
    sendResponse(res, {
        success: true,
        message: 'Category updated successfully',
        data: createdCategory,
        statusCode: 200,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const createdCategory = await CategoryService.deleteCategoryFromDB(req.params.id);
    sendResponse(res, {
        success: true,
        message: 'Category deleted successfully',
        data: createdCategory,
        statusCode: 200,
    });
});

export const CategoryController = {
    createCategory,
    getAllCategory,
    updateCategory,
    deleteCategory,
};
