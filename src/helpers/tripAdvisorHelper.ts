import axios from "axios";
import config from "../config";
import { Address } from "../app/modules/address/address.model";

const getLocationDetails = async (address: string,lang:string='en',addressId:string) => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/search?key=${config.tripAdvisor.key}&searchQuery=${address}`);
        const locationId = response.data?.data?.[0]?.location_id;
        const locationDetails = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=${lang}&currency=USD&key=${config.tripAdvisor.key}`);
        savePhotosInAddress(addressId,locationId)
        return locationDetails.data?.web_url
    } catch (error) {
        return ''
    }
};


export const TripAdvisorHelper = { getLocationDetails };

const savePhotosInAddress = async (addressId:string,location_id:string) => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${location_id}/photos?key=${config.tripAdvisor.key}`);
        const photos: TripAdvisorPhoto[] = response.data?.data;
        if(!photos.length){
            return ''
        }

        const images = photos.map((photo) => photo.images.large.url);
        await Address.findOneAndUpdate({ _id: addressId }, { imageUrl: images }, { new: true });
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
