import mongoose from "mongoose";
import { CategoryModel, ICategory } from "./category.interface";

const categorySchema = new mongoose.Schema<ICategory,CategoryModel>({
    name: { type: String, required: true },
});

export const Category = mongoose.model<ICategory,CategoryModel>("Category", categorySchema);