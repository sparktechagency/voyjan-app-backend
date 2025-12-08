import axios from "axios";
import config from "../config";

const getLocationDetails = async (address: string,lang:string='en') => {
    try {
        const response = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/search?key=${config.tripAdvisor.key}&searchQuery=${address}`);
        const locationId = response.data?.data?.[0]?.location_id;
        const locationDetails = await axios.get(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&currency=USD&key=${config.tripAdvisor.key}`);
        return locationDetails.data?.web_url
    } catch (error) {
        return ''
    }
};


export const TripAdvisorHelper = { getLocationDetails };