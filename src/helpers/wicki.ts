import axios from "axios";
import { LocationInfo } from "../app/modules/address/address.interface";
import wikipedia from "wikipedia"
import { Address } from "../app/modules/address/address.model";
import { translateLanguages } from "./translateHelper";
export const geosearchEn = async (lat: number, lon: number, radius = 10000, limit = 100): Promise<any[]> => {
    const params = {
        action: "query",
        list: "geosearch",
        gscoord: `${lat}|${lon}`,
        gsradius: radius,
        gslimit: limit,
        format: "json"
    };
    const res = await axios.get("https://en.wikipedia.org/w/api.php", { params,headers: { 'User-Agent': 'Voyazen/1.0 (https://voyazen.com; sharif@gmail)' } });
    console.log(res.data);
    
    return res.data.query?.geosearch || [];
}

export const savedLocationsInDB = async (locations: LocationInfo[]) => {

    for (const location of locations) {
       try {
        // make the whole thing using api of wikipedia
        const page = await wikipedia.page(location.pageid as any as string);
        const summary = await page.summary();
        const images = await page.images();
        const imageUrls = images.slice(0, 3).map(img => img.url).filter(url => url );
        // console.log(imageUrls,summary);
        

        // return 
        

        // const extract = page.data.query.pages[location.pageid].extract;
        // const image = page.data.query.pages[location.pageid].images[0]?.url;

        await Address.create({
            name: location.title,
            latitude: location.lat,
            longitude: location.lon,
            place: location.primary||location.title,
            formattedAddress: location.title,
            imageUrl: imageUrls,
            summary: summary.extract,
            type: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            diff_lange:await translateLanguages(summary.extract,location.title),
            location: {
                type: "Point",
                coordinates: [location.lon, location.lat]
            }
        });
       } catch (error) {
        console.log(error);
       }
    }
    return;

}