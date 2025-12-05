import express from "express";
import { VoiceController } from "./voice.controller";
import validateRequest from "../../middlewares/validateRequest";
import { VoiceValidation } from "./voice.validation";
const router = express.Router();

router.get("/",validateRequest(VoiceValidation.createVoiceZodSchema),VoiceController.changeTextToSpeech);
export const VoiceRoutes = router;