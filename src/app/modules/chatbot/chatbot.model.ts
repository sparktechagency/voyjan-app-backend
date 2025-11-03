import { model, Schema } from "mongoose";
import { IChatbot } from "./chatbot.interface";

const chatbotSchema = new Schema<IChatbot>({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
},{
    timestamps: true
});


export const Chatbot = model<IChatbot>("Chatbot", chatbotSchema);