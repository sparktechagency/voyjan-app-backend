import z from "zod";

const createChatbotMessageValidationZodSchema = z.object({
    body: z.object({
        message: z.string({ required_error: 'Message is required' }),
        language: z.string().optional(),
        userId: z.string(),
    }),
})


export const ChatbotValidation = {
    createChatbotMessageValidationZodSchema
}