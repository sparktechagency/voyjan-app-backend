import express from "express";
import { ChatbotController } from "./chatbot.controller";
import { ChatbotValidation } from "./chatbot.validation";
import validateRequest from "../../middlewares/validateRequest";
const router = express.Router();

router.post('/', validateRequest(ChatbotValidation.createChatbotMessageValidationZodSchema), ChatbotController.sendMessage);
export const ChatbotRoutes = router;