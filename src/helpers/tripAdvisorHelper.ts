import axios from "axios";
import config from "../config";
import { Address } from "../app/modules/address/address.model";
import { TripAdvisorResponse } from "../types/tripAdvisorResponse";
import { IAddress } from "../app/modules/address/address.interface";
import { elasticHelper } from "../handlers/elasticSaveData";
import { kafkaProducer } from "../handlers/kafka.producer";

const getLocationDetails = async (address: string,lang:string='en',addressId:string) => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/search?key=${config.tripAdvisor.key}&searchQuery=${address}`);
        const locationId = response.data?.data?.[0]?.location_id;
        const locationDetails = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=${lang}&currency=USD&key=${config.tripAdvisor.key}`);
        // savePhotosInAddress(addressId,locationId)
        return locationDetails.data?.web_url
    } catch (error) {
        return ''
    }
};

const getLocationDetailsByTripAdvisor = async (address: string,lang:string='en',addressId:string) => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/search?key=${config.tripAdvisor.key}&searchQuery=${address}`);
        const locationId = response.data?.data?.[0]?.location_id;
        const isExist = await Address.findOne({pageid:locationId}).lean();
        if(isExist){
          return
        }
        const [locationDetails, photos] = await Promise.all([
            axios.get(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=${lang}&currency=USD&key=${config.tripAdvisor.key}`),
            savePhotosInAddress(locationId)
        ]);
        const data:TripAdvisorResponse = {
            ...locationDetails.data,
            photos:photos as any
        }

        const formatted_data:IAddress = {
            name: data.name,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            place: data.name,
            formattedAddress: data.address_obj.address_string,
            summary: '',
            type: data.category.name,
            imageUrl: data.photos.length ? data.photos : [],
            city: data.address_obj?.city,
            state: data.address_obj?.city,
            country: data.address_obj?.country,
            postalCode: data.address_obj?.postalcode,
            location: {
                type: 'Point',
                coordinates: [Number(data.longitude), Number(data.latitude)],
            },
            pageid: locationId
        }
       const addressk= await Address.create(formatted_data);
        await elasticHelper.createIndex("address", addressk._id.toString(), formatted_data);
        await kafkaProducer.sendMessage("updateDescription",{});
        const io = (global as any).io
        io.emit('address', addressk);
    } catch (error) {
        return {
            
        } as TripAdvisorResponse
    }
};



export const TripAdvisorHelper = { getLocationDetails, getLocationDetailsByTripAdvisor };

const savePhotosInAddress = async (location_id:string) => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${location_id}/photos?key=${config.tripAdvisor.key}`);
        const photos: TripAdvisorPhoto[] = response.data?.data;
        if(!photos.length){
            return ''
        }

        const images = photos.map((photo) => photo.images.large.url);
        


        return images
    }
    catch (error) {
        return ''
    }
}




































































export interface TripAdvisorPhotosResponse {
  data: TripAdvisorPhoto[];
}

export interface TripAdvisorPhoto {
  id: number;
  is_blessed: boolean;
  caption: string;
  published_date: string;
  images: TripAdvisorImages;
  album: string;
  source: PhotoSource;
  user: PhotoUser;
}

export interface TripAdvisorImages {
  thumbnail: PhotoSize;
  small: PhotoSize;
  medium: PhotoSize;
  large: PhotoSize;
  original?: PhotoSize; // Some items may not include original
}

export interface PhotoSize {
  height: number;
  width: number;
  url: string;
}

export interface PhotoSource {
  name: string;
  localized_name: string;
}

export interface PhotoUser {
  username: string;
}
