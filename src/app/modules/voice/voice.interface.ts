import { Model, Types } from "mongoose";

export type IVoice = {
    text: string;
    voice: string;
    lang: string;
    address_id: Types.ObjectId;
    expiresAt: Date;
}

export type VoiceModel = Model<IVoice>;