import { Model } from "mongoose";

export type IAddress = {
    name: string;
    latitude: number;
    longitude: number;
    place: string;
    formattedAddress: string;
    imageUrl?: string[];
    summary?: string;
    type?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    location:{
        type: "Point";
        coordinates: number[]
    },
    diff_lang?:Record<string, {translateText: string}>
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

export type AddressModel = Model<IAddress, {}>;