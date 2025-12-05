import mongoose from "mongoose";
import { IVoice, VoiceModel } from "./voice.interface";

const voiceSchema = new mongoose.Schema<IVoice,VoiceModel>({
    text: { type: String, required: true },
    voice: { type: String, required: true },
    lang: { type: String, required: true },
    address_id: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    //expiresAt 3days
    expiresAt: { type: Date, required: false,default:new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
});



voiceSchema.index({address_id:1})

export const Voice = mongoose.model<IVoice,VoiceModel>("Voice", voiceSchema);