import mongoose from "mongoose";

export type IChatbot = {
    question: string;
    answer: string;
    author: "chatbot" | "user" | string
}

export type ChatbotModel = mongoose.Model<IChatbot>;