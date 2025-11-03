import { Model } from "mongoose"

export type ICategory = {
    _id: string,
    name: string
}

export type CategoryModel = Model<ICategory>