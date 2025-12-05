import textToSpeech from "@google-cloud/text-to-speech";
import fs from "fs";
import path from "path";
import { language } from "../../../data/language";
import { Response } from "express";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { hashText } from "../../../shared/hashText";
import { RedisHelper } from "../../../helpers/redisHelper";

const client = new textToSpeech.TextToSpeechClient({
    keyFilename: path.join(process.cwd(),'key',"julien-voice.json"),
})

const changeTextToSpeech = async (text: string,lang: string,res:Response) => {
    const hashExist = await RedisHelper.redisGet(hashText(text,lang));
    if(hashExist){
        const exist = hashExist as any
        
        const audioPath = path.join(process.cwd(), "uploads",exist.voice);
        return res.setHeader("Content-Type", "audio/mp3").sendFile(audioPath);
    }
    const lngItem = language.find((item) => item.code === lang);
    if(!lngItem?.code){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Language not found!");
    }

    const tempPath = `/voice/${lngItem.voice+Date.now()}.mp3`;

    const audioPath = path.join(process.cwd(), "uploads",tempPath);

    if (!fs.existsSync(audioPath)) {
        fs.mkdirSync(path.join(process.cwd(), "uploads",'voice'), { recursive: true });
    }


    const [response] = await client.synthesizeSpeech({
        input: { text: text },
        voice: { languageCode: lngItem?.lang, name: lngItem?.voice},
        audioConfig: { audioEncoding: "MP3" },
    });

    const audioContent = response.audioContent;

    if (!audioContent) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Audio content not found!"
        )
    }

    fs.writeFileSync(audioPath, audioContent as any, "binary");
    const hash = hashText(text, lang);
    console.log(hash);
    
    await RedisHelper.redisSet(hash,{voice:tempPath},{},60*60*24*3);
    res.setHeader("Content-Type", "audio/mp3");
   return res.send(audioContent);

}


export const VoiceService = {
    changeTextToSpeech
}
