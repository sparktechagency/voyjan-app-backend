import express from "express";
import { CategoryController } from "./category.controller";
import validateRequest from "../../middlewares/validateRequest";
const router = express.Router();

router.post("/", CategoryController.createCategory);
router.get("/", CategoryController.getAllCategory);
router.patch("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);
export const CategoryRoutes = router;