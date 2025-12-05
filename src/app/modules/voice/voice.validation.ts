import mongoose from "mongoose";
import z from "zod";

const createVoiceZodSchema = z.object({
    body: z.object({
        text: z.string({ required_error: "Text is required" }),
        lang: z.string({ required_error: "Language is required" }),
        address_id: z.string({ required_error: "Address id is required" }).refine((value) => {
            return mongoose.Types.ObjectId.isValid(value);
        }, "Invalid address id").optional()
    }),
});


export const VoiceValidation = {
    createVoiceZodSchema,
};