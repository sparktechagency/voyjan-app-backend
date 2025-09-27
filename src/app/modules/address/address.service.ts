import { getFromOSM, getLatlongUsingAddress } from "../../../helpers/getLatlongUsingAddress";
import { geosearchEn, savedLocationsInDB } from "../../../helpers/wicki";
import { IAddress } from "./address.interface";
import XLSX from "xlsx";
import { Address } from "./address.model";
import path from "path";
import QueryBuilder from "../../builder/QueryBuilder";
import { translateLanguages } from "../../../helpers/translateHelper";
const createAddressIntoDB = async (address: string) => {
    const { latitude: lat, longitude: lon } = await getFromOSM(address);

    
    


    const latlong = await geosearchEn(lat!, lon!);
    
   await savedLocationsInDB(latlong);
    return;
    
}


const createAddressSingleIntoDB = async (address: IAddress) => {
    address.location = {
        type: "Point",
        coordinates: [address.longitude, address.latitude],
    }

    address.diff_lang = await translateLanguages(address.summary!, address.name);


    const latlong = await Address.create(address);
    return latlong
}

const addDataFromExcelSheet =async (pathData: string)=>{
    // Parse Excel

    const filePath = path.join(process.cwd(),"uploads", pathData);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    // Convert to IAddress format
    const addresses = await Promise.all(
      sheet.map(async (row) => ({
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      place: row.place,
      formattedAddress: row.formattedAddress,
      imageUrl: row.imageUrl ? String(row.imageUrl).split(",") : [],
      summary: row.summary || undefined,
      type: row.type || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      country: row.country || undefined,
      postalCode: row.postalCode || undefined,
      location: {
        type: "Point",
        coordinates: [Number(row.longitude), Number(row.latitude)],
      },
      diff_lang:await translateLanguages(row.summary!, row.name),
    }))
    )

    // Save to MongoDB
    const saved = await Address.insertMany(addresses);

    return saved
}


const searchByLatlong = async (address: string,radius: string="5") => {
    const latlong = await getFromOSM(address);
    const addresses = await Address.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [latlong.longitude, latlong.latitude], // lng, lat
      },
      $maxDistance: Number(radius)*1000, // optional: in meters (e.g., 5km)
      $minDistance: 0,    // optional
    },
  },
});
    return addresses;
}


const getAllAddress = async (query: Record<string, unknown>) => {
    const addressQuery = new QueryBuilder(Address.find(), query).filter().search(['name']).sort().paginate()

    const [address,pagination] = await Promise.all([addressQuery.modelQuery.lean(), addressQuery.getPaginationInfo()])
    return {address,pagination}
}

const updateAddress = async (addressId: string, data: Record<string, unknown>) => {
    const address = await Address.findOneAndUpdate({ _id: addressId }, data, { new: true });
    return address;
}

const deleteAddress = async (addressId: string) => {
    const address = await Address.findByIdAndDelete(addressId);
    return address;
}


export const AddressService = {
    createAddressIntoDB,
    createAddressSingleIntoDB,
    addDataFromExcelSheet,
    searchByLatlong,
    getAllAddress,
    updateAddress,
    deleteAddress
}