import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ChatbotService } from "./chatbot.service";
import sendResponse from "../../../shared/sendResponse";

const sendMessage = catchAsync(async (req:Request,res:Response) => {
    console.log(req.body);
    
    const createdAddress = await ChatbotService.sendResponseFromChatbot(req.body?.message,req.body?.language,req.body?.userId);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        data: createdAddress,
        statusCode: 200,
    });
})


export const ChatbotController = {
    sendMessage
}