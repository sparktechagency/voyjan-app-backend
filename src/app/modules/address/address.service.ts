import {
  getFromOSM,
  getLatlongUsingAddress,
} from '../../../helpers/getLatlongUsingAddress';
import {
  addDetailsInExistingAddress,
  addNotFoundData,
  addShortDescription,
  geosearchEn,
  savedLocationsInDB,
  savedLocationsInDBParrelal,
} from '../../../helpers/wicki';
import { ElastcSaveType, IAddress } from './address.interface';
import XLSX from 'xlsx';
import { Address } from './address.model';
import path from 'path';
import QueryBuilder from '../../builder/QueryBuilder';
import { translateLanguages } from '../../../helpers/translateHelper';
import { Server } from 'socket.io';
import { elasticHelper } from '../../../handlers/elasticSaveData';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { generateAiContnents } from '../../../helpers/generateDescriptions';
import { RedisHelper } from '../../../helpers/redisHelper';
import { redisClient } from '../../../config/redis.client';
import { getImagesFromApi } from '../../../helpers/imageHelper';
import { add } from 'winston';
import { compressImageFromUrl } from '../../../helpers/comprass-icon';
const createAddressIntoDB = async (address: string) => {
  const { latitude: lat, longitude: lon, place } = await getFromOSM(address);

  if (!lat || !lon) return;
  const latlong = await geosearchEn(lat!, lon!);

  await savedLocationsInDBParrelal(latlong, place);
  return;
};

const createAddressSingleIntoDB = async (address: IAddress) => {
const { latitude: lat, longitude: lon, place } = await getFromOSM(address.name);


  if (!lat || !lon) return;
  const latlong = await geosearchEn(lat!, lon!,1000,1);

  console.log(latlong);
  
  await savedLocationsInDBParrelal(latlong, place);
  return;
};

const addDataFromExcelSheet = async (pathData: string) => {
  // Parse Excel

  const filePath = path.join(process.cwd(), 'uploads', pathData);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

  // Convert to IAddress format
  const addresses = await Promise.all(
    sheet.map(async row => ({
      name: row.name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      place: row.place,
      formattedAddress: row.formattedAddress,
      imageUrl: row.imageUrl ? String(row.imageUrl).split(',') : [],
      summary: row.summary || undefined,
      type: row.type || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      country: row.country || undefined,
      postalCode: row.postalCode || undefined,
      location: {
        type: 'Point',
        coordinates: [Number(row.longitude), Number(row.latitude)],
      },
      diff_lang: await translateLanguages(
        row.summary!,
        row.name,
        row.type!,
        row.formattedAddress
      ),
    }))
  );
  const io = (global as any).io as Server;

  for (const address of addresses) {


    const saved = await Address.create(address);

    await elasticHelper.createIndex('address', saved._id.toString()!, address);
    io.emit('add-address', saved?.name);
  }

  return;
};

const searchByLatlong = async (
  latlong: { latitude: number; longitude: number },
  radius: string = '5',
  lang: string = 'English',
  type: string[] = []
) => {
  console.log(type);
  
  const cache = await RedisHelper.redisGet("address",{radius:radius,lang:lang,type:type,lat:latlong.latitude,lon:latlong.longitude});
  if(cache) {
    console.log('cache found');
    return cache
    
  }
  const addresses = await Address.find({
    ...(type?.length ? { type: { $in: type } }: {}),
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [latlong.longitude, latlong.latitude], // lng, lat
        },
        $maxDistance: Number(radius) * 1000, // optional: in meters (e.g., 5km)
        $minDistance: 0, // optional
      },
    },
  },{diff_lang:0}).lean();

  if (!addresses.length || addresses.length < 30) {
    addNotFoundData(latlong.latitude, latlong.longitude, Number(radius));
  }

  if(addresses.length) {
    
    await RedisHelper.redisSet("address",addresses,{radius:radius,lang:lang,type:type,lat:latlong.latitude,lon:latlong.longitude},60);
  }


  return addresses;
};

const getAllAddress = async (query: Record<string, unknown>) => {
  const addressQuery = new QueryBuilder(Address.find(), query)
    .filter()
    .search(['name'])
    .sort()
    .paginate();

  const [address, pagination] = await Promise.all([
    addressQuery.modelQuery.lean(),
    addressQuery.getPaginationInfo(),
  ]);

  return { address, pagination };
};

const updateAddress = async (
  addressId: string,
  data: Record<string, unknown>
) => {
  const address = await Address.findOneAndUpdate({ _id: addressId }, data, {
    new: true,
  });
  return address;
};

const deleteAddress = async (addressId: string) => {
  const address = await Address.findByIdAndDelete(addressId);
  return address;
};

const searchAddress = async (address: string) => {
  const searchData = await elasticHelper.searchIndex('address', address, [
    'type',
    'diff_lang.*.translateText',
    'diff_lang.*.title',
    'diff_lang.*.address',
  ]);
  
  const data = searchData?.map(address => {
    delete (address._source as any)?.diff_lang
    return {
      ...(address?._source || {}),
      _id: address?._id,
    };
  });

  return data;
};

const singleAaddressFromDB = async (addressId: string,lang:string='English') => {
  const cache = await RedisHelper.redisGet(`${addressId}`,{lang:lang});
  if(cache) {
    console.log('cache found');
    return cache
  }
  const address = await Address.findById(addressId).lean();
  if(!address) throw new ApiError(StatusCodes.NOT_FOUND,'Address not found');

  if(!address.imageUrl?.length){
    addmissingImages(address as any)
  }
  if(!address.long_descreption){
    addShortDescription(address as any)
  }
  if(!address.diff_lang?.English?.translateText) {
   createBackegroundDescription(address)
  }

  if(!address.diff_lang?.[lang]?.translateLong){

    if(!address.summary){
      addDetailsInExistingAddress([address as any])
    }
    if(!address.long_descreption){
      
      addShortDescription(address as any)
    }

    address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.formattedAddress,address.long_descreption||address.summary||'')
    await elasticHelper.updateIndex('address', address._id.toString()!, address)
    await RedisHelper.keyDelete(`${addressId}`);
    await redisClient.del(`${addressId}`);
  }

  const data = {
    translateText: address.diff_lang?.[lang]?.translateText||'',
    translateLongText: address.diff_lang?.[lang]?.translateLong||'',
    transltedTitle: address.diff_lang?.[lang]?.title||'',
    transltedType: address.diff_lang?.[lang]?.type||'',
    transltedAddress: address.diff_lang?.[lang]?.address||'',
  }

  if(!Object.values(data).includes('')) {
    await RedisHelper.redisSet(`${addressId}`,data,{lang:lang},1000000);
  }
  return data
}


async function createBackegroundDescription(address:any) {
    address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.place,address.long_descreption)
    await elasticHelper.updateIndex('address', address._id.toString()!, address)
      await Address.findOneAndUpdate({ _id: address._id }, {
    diff_lang: address.diff_lang,}, {
    new: true,
  })
  await RedisHelper.keyDelete(`${address._id}`);
}

async function addmissingImages(address:IAddress&{_id:string}) {

  const images = await getImagesFromApi(address.place);
  await Address.findOneAndUpdate({ _id: address._id }, {
    imageUrl: images,}, {
    new: true,
  })
  await elasticHelper.updateIndex('address', address._id.toString()!, address)
  await RedisHelper.keyDelete(`${address._id}`);
  await redisClient.del(`${address._id}`)
  await RedisHelper.keyDelete(`address`);  
}

export const AddressService = {
  createAddressIntoDB,
  createAddressSingleIntoDB,
  addDataFromExcelSheet,
  searchByLatlong,
  getAllAddress,
  updateAddress,
  deleteAddress,
  searchAddress,
  singleAaddressFromDB
};
