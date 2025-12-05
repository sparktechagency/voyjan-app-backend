import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { VoiceService } from "./voice.service";
import sendResponse from "../../../shared/sendResponse";

const changeTextToSpeech = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await VoiceService.changeTextToSpeech(req.query?.text as string,req.query?.lang as string,res);
})


export const VoiceController = {
    changeTextToSpeech
}