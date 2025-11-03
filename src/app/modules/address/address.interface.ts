import { Model } from "mongoose";

export type IAddress = {
    name: string;
    latitude: number;
    longitude: number;
    place: string;
    long_descreption?: string;
    formattedAddress: string;
    imageUrl?: string[];
    summary?: string;
    pageid?: number;
    type?: string;
    city?: string;
    isCompleted?: boolean;
    state?: string;
    country?: string;
    postalCode?: string;
    location:{
        type: "Point";
        coordinates: number[]
    },
    diff_lang?:Record<string, {translateText: string,title:string,type:string,address:string,translateLong:string}>
};





export interface LocationInfo {
  pageid: number;
  ns: number;
  title: string;
  lat: number;
  lon: number;
  dist: number;
  primary: string;
}


export interface ElastcSaveType {
  name: string;
  title: string;
  type: string;
  address: string;
  summary: string;
  lat: number;
  lon: number;
  _id: string;
}

export type AddressModel = Model<IAddress, {}>;