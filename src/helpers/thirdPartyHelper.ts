import axios from "axios";

export const getAutoCompleteFromApi = async (address: string): Promise<PhotonFeatureCollection> => {
    try {
        const response = await axios.get(
            `https://photon.komoot.io/api/?q=${address}&limit=10`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        return {
            type: "FeatureCollection",
            features: [],
        };
    }
};

export interface PhotonFeatureCollection {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

export interface PhotonFeature {
  type: "Feature";
  properties: PhotonProperties;
  geometry: PhotonGeometry;
}

export interface PhotonProperties {
  osm_type: string;
  osm_id: number;
  osm_key: string;
  osm_value: string;
  type: string;
  postcode?: string;
  countrycode: string;
  name: string;
  country: string;
  state?: string;
  county?: string;
}

export interface PhotonGeometry {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}
