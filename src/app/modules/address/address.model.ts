import mongoose from "mongoose";
import { AddressModel, IAddress } from "./address.interface";

const addressSchema = new mongoose.Schema<IAddress, AddressModel>({
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    place: { type: String, required: true },
    formattedAddress: { type: String, required: true },
    imageUrl: [{ type: String, required: false }],
    summary: { type: String, required: false },
    type: { type: String, required: false,default:"Other" },
    city: { type: String, required: false },
    state: { type: String, required: false },
    status: { type: String, required: false },
    country: { type: String, required: false },
    postalCode: { type: String, required: false },
    long_descreption: { type: String, required: false },
    location:{
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    diff_lang:{
        type:mongoose.Schema.Types.Mixed
    },
    isCompleted:{type:Boolean,required:false,default:false},
    pageid:{type:Number,required:false},
    address_add:{
        type:Boolean,
        default:false
    }
},{
    timestamps: true
});

addressSchema.index({ latitude: 1, longitude: 1 });
addressSchema.index({ location: "2dsphere" });
addressSchema.pre("save", function (next) {
    this.location = {
        type: "Point",
        coordinates: [this.longitude, this.latitude],
    };
    next();
})





export const Address = mongoose.model<IAddress, AddressModel>("Address", addressSchema);

