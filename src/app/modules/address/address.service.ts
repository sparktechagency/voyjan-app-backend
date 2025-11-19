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
import { getAutoCompleteFromApi } from '../../../helpers/thirdPartyHelper';
import { getCitySummary } from '../../../helpers/cityHelper';
const createAddressIntoDB = async (address: string) => {
  const { latitude: lat, longitude: lon, place } = await getFromOSM(address);


  if (!lat || !lon) return;
  const latlong = await geosearchEn(lat!, lon!);

  await savedLocationsInDBParrelal(latlong, place);
  return;
};

const createAddressSingleIntoDB = async (address: IAddress) => {

  const details = await getCitySummary(address.name)
  const data = {
    name: details?.title || address.name,
    latitude: details?.coordinates?.lat || address.latitude,
    longitude: details?.coordinates?.lon || address.longitude,
    place: details?.title || address.name,
    formattedAddress: address.name,
    imageUrl: address.imageUrl ? String(address.imageUrl).split(',') : [details?.thumbnail?.source || ''],
    summary:details?.extract || '',
    type: address.type || address?.place,
    city: address.city || undefined,
    state: address.state || undefined,
    country: address.country || undefined,
    postalCode: address.postalCode || undefined,
    location: {
      type: 'Point',
      coordinates: [details?.coordinates?.lon || address.longitude, details?.coordinates?.lat || address.latitude], // lng, lat
    },
    pageid: details?.pageid
  }
  await Address.create(data)
   addDetailsInExistingAddress([data as any])
   const io = (global as any).io as Server
   io.emit('address', data)
  return;
};

const addDataFromExcelSheet = async (pathData: string) => {
  // Parse Excel

  const filePath = path.join(process.cwd(), 'uploads', pathData);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
  const io = (global as any).io as Server
  
  // Convert to IAddress format
  const addresses = await Promise.all(
    sheet.map(async row =>{
      const getWikiData =await getCitySummary(row?.name)
      const data = {
      name: getWikiData?.title || row.name,
      latitude: getWikiData?.coordinates?.lat || Number(row.latitude),
      longitude: getWikiData?.coordinates?.lon || Number(row.longitude),
      place: getWikiData?.title || row.name,
      formattedAddress: row['formatted address'],
      imageUrl: row.imageUrl ? String(row.imageUrl).split(',') : [getWikiData?.thumbnail?.source || ''],
      summary:getWikiData?.extract || '',
      type: row.type || row?.place,
      city: row.city || undefined,
      state: row.state || undefined,
      country: row.country || undefined,
      postalCode: row.postalCode || undefined,
      location: {
        type: 'Point',
        coordinates: [getWikiData?.coordinates?.lon || Number(row.longitude), getWikiData?.coordinates?.lat || Number(row.latitude)],
      },
      pageId:getWikiData?.pageid || 0
    }
    io.emit('address', data);
    return data
    }
  )
  );


  await Address.insertMany(addresses);
  io.emit('address', {title:'completed'});

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
    summary:{$ne:''},
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

const searchAddress = async (query:Record<string,any>) => {
  if (query?.searchTerm?.length < 2) return [];
  const cache = await RedisHelper.redisGet("address",query);
  if(cache) {
    console.log('cache found');
    return cache 
  }
  const searchData = await elasticHelper.searchIndex('address', query.searchTerm, [
    'type',
    // 'diff_lang.*.translateText',
    // 'diff_lang.*.title',
    // 'diff_lang.*.address',
    // "formattedAddress",
    "name",
  ],query?.page,query?.limit);

  if(!searchData?.data?.length) {
    const apiData = await getAutoCompleteFromApi(query.searchTerm)
    const data = apiData?.features?.map((address) => {
      return {
        name: address?.properties?.name,
        type: address?.properties?.type,
        formattedAddress: `${address?.properties?.name}, ${address?.properties?.state || ''}, ${address?.properties?.country}`,
        lat: address?.geometry?.coordinates[1],
        lon: address?.geometry?.coordinates[0],
      };
    })
    if(query?.searchTerm?.length>2) {
      createAddressIntoDB(query.searchTerm);
      
    }
    await RedisHelper.redisSet("address",{data},query,3600);
    return { data};
  }
  
  const data = searchData?.data?.map((address: any) => {
    delete (address._source as any)?.diff_lang
    return {
      name: address._source.name,
      type: address._source.type,
      formattedAddress: address._source.formattedAddress,
      lat: address._source.latitude,
      lon: address._source.longitude,
      _id: address?._id,
    };
  });

  console.log('from Db');
  
  await RedisHelper.redisSet("address",{data},query,3600);
  return { data};
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

    address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.formattedAddress,address.long_descreption||address.summary||'',lang)
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


    await RedisHelper.redisSet(`${addressId}`,data,{lang:lang},60);
  
  return data
}


async function createBackegroundDescription(address:any) {
    address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.place,address.long_descreption)
    // await elasticHelper.updateIndex('address', address._id.toString()!, address)
      await Address.findOneAndUpdate({ _id: address._id }, {
    diff_lang: address.diff_lang,}, {
    new: true,
  })
  await RedisHelper.keyDelete(`${address._id}`);
}

async function addmissingImages(address:IAddress&{_id:string}) {

  const images = await getImagesFromApi(address.name);
  await Address.findOneAndUpdate({ _id: address._id }, {
    imageUrl: images,}, {
    new: true,
  })
  // await elasticHelper.updateIndex('address', address._id.toString()!, address)
  await RedisHelper.keyDelete(`${address._id}`);
  await redisClient.del(`${address._id}`)
  await RedisHelper.keyDelete(`address`);  
  console.log('images added');
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
