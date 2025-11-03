import { chatbot } from "../../../config/chatbot.config";
import { getPrompt } from "./chatbot.constrant";
import { Chatbot } from "./chatbot.model";

const sendResponseFromChatbot = async (message: string, language?: string,userId?:string) => {
    const prevMessages = await Chatbot.find({ author: userId }).sort({ createdAt: -1 }).limit(5).lean().exec();
    const formatMessages = prevMessages.map((message) => `User: ${message.question}\nAI: ${message.answer}`).join("\n");
    const propmt = getPrompt(message,language,formatMessages);
    const response = await chatbot.generateContent(propmt);

    
const res = response.response.text()?.replace(/(\r\n|\n|\r)/gm, " ");

    await Chatbot.create({ question: message, answer: res, author: userId });
    return res
}

export const ChatbotService = {
    sendResponseFromChatbot
}