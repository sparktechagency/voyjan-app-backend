import { GoogleGenerativeAI } from '@google/generative-ai'; 
import config from '.';
const chatbotModel = new GoogleGenerativeAI(config.gemini.key!);

export const  chatbot = chatbotModel.getGenerativeModel({
    model:"gemini-2.5-flash",
})