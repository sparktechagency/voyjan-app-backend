import {
  getFromOSM,
  getLatlongUsingAddress,
} from '../../../helpers/getLatlongUsingAddress';
import {
  addDetailsInExistingAddress,
  addLongDescription,
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
import { singleTextTranslation, singleTextTranslationWithLibre, translateLanguages } from '../../../helpers/translateHelper';
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
import { Category } from '../category/category.model';
import { TripAdvisorHelper } from '../../../helpers/tripAdvisorHelper';
import { Types } from 'mongoose';
import { safeObjectId } from '../../../helpers/mongoIdChecker';
import { kafkaProducer } from '../../../handlers/kafka.producer';
const createAddressIntoDB = async (address: string) => {
try {
    const { latitude: lat, longitude: lon, place } = await getFromOSM(address);


  if (!lat || !lon) return;
  const latlong = await geosearchEn(lat!, lon!);

  await savedLocationsInDBParrelal(latlong, place);
} catch (error) {
  
}
  return;
};

const createAddressSingleIntoDB = async (address: IAddress) => {
  try {
  const details = await getCitySummary(address.name)
  console.log(details);
  
  if(!details?.pageid) {
    const getInformationByTripAdvisonr = await TripAdvisorHelper.getLocationDetailsByTripAdvisor(address.name,'en','');
    console.log(getInformationByTripAdvisonr);
    return
    
  }
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
    pageid: details?.pageid,
    is_personal:true
  }
  
  await Address.create(data);
   if(!address) return
   addDetailsInExistingAddress([data as any])
   const io = (global as any).io as Server
   io.emit('address', data)
  return;
  } catch (error) {
    console.log(error);
    
  }
};

const addDataFromExcelSheet = async (pathData: string) => {
try {
  
  const filePath = path.join(process.cwd(), 'uploads', pathData);
 
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

  
  const io = (global as any).io as Server
  
  // Convert to IAddress format
  const addresses = await Promise.all(
    sheet.map(async row =>{
      const [getWikiData, tripAdvisorData] = await Promise.all([
        getCitySummary(row?.name),
        TripAdvisorHelper.getLocationDetailsByTripAdvisor(row?.name,'en','')
      ])
      const data = {
      name:row.name || getWikiData?.title||tripAdvisorData?.name ,
      latitude: getWikiData?.coordinates?.lat || Number(tripAdvisorData?.latitude) || Number(row.latitude),
      longitude: getWikiData?.coordinates?.lon || Number(tripAdvisorData?.longitude) || Number(row.longitude),
      place: getWikiData?.title ||tripAdvisorData?.name || row.name,
      formattedAddress: row['formatted_address'] ,
      imageUrl: row.imageUrl ? String(row.imageUrl).split(',') :getWikiData?.thumbnail?.source ? [getWikiData?.thumbnail?.source] : tripAdvisorData?.photos?.length ? tripAdvisorData.photos : [],
      summary:getWikiData?.extract || '',
      type: row.type || row?.place,
      city: row.city || tripAdvisorData?.address_obj?.city || undefined,
      state: row.state || tripAdvisorData?.address_obj?.city || undefined,
      country: row.country || tripAdvisorData?.address_obj?.country || undefined,
      postalCode: row.postalCode || tripAdvisorData?.address_obj?.postalcode || undefined,
      location: {
        type: 'Point',
        coordinates: [getWikiData?.coordinates?.lon || Number(tripAdvisorData?.longitude) || Number(row.longitude), getWikiData?.coordinates?.lat || Number(tripAdvisorData?.latitude) || Number(row.latitude)],
      },
      pageId:getWikiData?.pageid||tripAdvisorData?.location_id || 0,
      is_personal:true
    }


    io.emit('address', data);
    
    return data
    }
  )
  );


  for(const address of addresses){
    const addressk = await Address.create(address);
    await elasticHelper.createIndex("address", addressk._id.toString(), addressk);
    io.emit('address', addressk);
  }
  addLongDescription(200,false);
  io.emit('address', {title:'completed'});

  return;
} catch (error) {
  console.log(error);
  
}
};

const searchByLatlong = async (
  latlong: { latitude: number; longitude: number },
  radius: string = '5',
  lang: string = 'English',
  type: string[] = []
) => {
  if(!type.length){
    return []
  }
  
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
  },{diff_lang:0,long_descreption:0,summary:0,city:0,state:0,country:0,postalCode:0,pageid:0,status:0,isCompleted:0}).lean();

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
  await elasticHelper.updateIndex('address',addressId,data);
  return address;
};

const deleteAddress = async (addressId: string) => {
  const address = await Address.findByIdAndDelete(addressId);
  await elasticHelper.deleteIndex('address',addressId);
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
      try {
        createAddressIntoDB(query.searchTerm);
      } catch (error) {
        console.log(error);
        
      }
      
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


  
  await RedisHelper.redisSet("address",{data},query,3600);
  return { data};
};

const singleAaddressFromDB = async (addressId: string,lang:string='English') => {
try {
    if(!(new Types.ObjectId(addressId))){
    return {error:'Invalid addressId'}
  }
  const cache = await RedisHelper.redisGet(`${addressId}`,{lang:lang});
  if(cache) {
    console.log('cache found');
    return cache
  }
  const address = await Address.findById(addressId).lean();
  if(!address) throw new ApiError(StatusCodes.NOT_FOUND,'Address not found');

if(lang!=='English') {
    const isExist = await Category.findOne({ name: address.diff_lang?.[lang]?.type });
  if (isExist) {
    const translateCategory = await singleTextTranslation(address.diff_lang?.[lang]?.type!,lang);
    singleCategoryChangeAndSave(address._id.toString(),translateCategory,lang);
    address.diff_lang = {
      ...address.diff_lang,
      [lang]: {
        ...address.diff_lang?.[lang],
        type: translateCategory,
      },
    }as any
  }
}

console.log(address);


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

    address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.formattedAddress,address.long_descreption||address.summary||'',lang) as any
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
} catch (error) {
  console.log(error);
  
}
}


async function createBackegroundDescription(address:any) {
try {
      address.diff_lang = await translateLanguages(address.summary!, address.name,address.type!,address.place,address.long_descreption)
    // await elasticHelper.updateIndex('address', address._id.toString()!, address)
    if(!safeObjectId(address._id)){
      return
    }
      await Address.findOneAndUpdate({ _id: address._id }, {
    diff_lang: address.diff_lang,}, {
    new: true,
  })
  await RedisHelper.keyDelete(`${address._id}:*`);
} catch (error) {
  console.log(error);
  
}
}

async function addmissingImages(address:IAddress&{_id:string}) {
try {
  console.log("image finding by pixbay");
  
  
  const images = await getImagesFromApi(address.name);
  await Address.findOneAndUpdate({ _id: address._id }, {
    imageUrl: images,}, {
    new: true,
  })
  // await elasticHelper.updateIndex('address', address._id.toString()!, address)
  await RedisHelper.keyDelete(`${address._id}:*`);
  await redisClient.del(`${address._id}:*`)
  await RedisHelper.keyDelete(`address:*`);  
  console.log('images added');
} catch (error) {
  console.log(error);
  
}
}

async function singleCategoryChangeAndSave(id:string,translateType:string,originLang:string) {
try {
  if(!(new Types.ObjectId(id))){
    return 
  }
    const getAddress = await Address.findById(id).lean();
  let diff_lang = getAddress?.diff_lang;
  diff_lang![originLang].type = translateType;
  await Address.findOneAndUpdate({ _id: id }, {
    diff_lang: diff_lang,}, {
    new: true,
  })
  await RedisHelper.keyDelete(`${id}:*`);
  await redisClient.del(`${id}`);
} catch (error) {
  console.log(error);
  
}

}

const addressBulkDelete = async (addressIds: string[]) => {
  const address = await Address.deleteMany({ _id: { $in: addressIds } });
  deleteBulk(addressIds);
  return address;
};

async function deleteBulk(ids:string[]) {
for(const id of ids){
  await elasticHelper.deleteIndex('address',id);
}
}

const translateSingleText = async (text:string) => {
  const data = await singleTextTranslationWithLibre(text,'en');
  return data
}

const getWebdetailsOfAddress = async (id: string,lang:string='en') => {
  const cache =await RedisHelper.redisGet(`details:${id}`,{lang:lang});
  if(cache) {
    console.log('cache found');
    return cache
  }
  const address = await Address.findById(id).lean();
  const web_url = await TripAdvisorHelper.getLocationDetails(address?.name!,lang,id);
  if(!web_url) throw new ApiError(StatusCodes.NOT_FOUND,'Address not found');
  await RedisHelper.redisSet(`details:${id}`,web_url,{lang:lang},60);
  return web_url
};



export const AddressService = {
  createAddressIntoDB,
  createAddressSingleIntoDB,
  addDataFromExcelSheet,
  searchByLatlong,
  getAllAddress,
  updateAddress,
  deleteAddress,
  searchAddress,
  singleAaddressFromDB,
  addressBulkDelete,
  translateSingleText,
  getWebdetailsOfAddress
};
