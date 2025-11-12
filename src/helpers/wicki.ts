import axios from 'axios';
import {
  IAddress,
  LocationInfo,
} from '../app/modules/address/address.interface';
import wikipedia from 'wikipedia';
import { Address } from '../app/modules/address/address.model';
import { translateLanguages } from './translateHelper';
import { elasticHelper } from '../handlers/elasticSaveData';
import { kafkaProducer } from '../handlers/kafka.producer';
import { Category } from '../app/modules/category/category.model';
import { generateAiContnents, getTheTypeUsingAI } from './generateDescriptions';
import config from '../config';
import { RedisHelper } from './redisHelper';
import { redisClient } from '../config/redis.client';
import { getCityByPageId, getCitySummary, WikiPage } from './cityHelper';

wikipedia.setUserAgent('VoyazenApp/1.0 (sharif@example.com)');
export const geosearchEn = async (
  lat: number,
  lon: number,
  radius = 10000,
  limit = 200
): Promise<any[]> => {
  const params = {
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat}|${lon}`,
    gsradius: radius,
    gslimit: limit,
    format: 'json',
  };
  const res = await axios.get('https://en.wikipedia.org/w/api.php', {
    params,
    headers: {
      'User-Agent': 'Voyazen/1.0 (https://voyazen.com; sharif@gmail)',
    },
  });


  

  return res.data.query?.geosearch || [];
};

export const savedLocationsInDB = async (
  locations: LocationInfo[],
  placeI?: string
) => {
  const placeArr = placeI?.split(',');
  placeArr?.reverse()?.pop();

  const place = placeArr?.join(',');

  const io = (global as any).io;
  for (const location of locations) {
    try {
      const extist = await Address.findOne({ pageid: location.pageid });
      if (extist) continue;
      // make the whole thing using api of wikipedia
      const page = await wikipedia.page(location.pageid as any as string);
      const summary = await page.summary();

      const images = await page.images();

      const imageUrls = images
        ?.map(img => img.url)
        .filter(
          url =>
            url && ['jpg', 'png', 'jpeg'].includes(url?.split('.')?.pop() || '')
        );
      // console.log(imageUrls,summary);

      // return

      const [translate, category] = await Promise.all([
        translateLanguages(
          summary.extract,
          location.title,
          await getGetCategory(page),
          location.title
        ),
        getGetCategory(page),
      ]);

      // const extract = page.data.query.pages[location.pageid].extract;
      // const image = page.data.query.pages[location.pageid].images[0]?.url;

      const data = await Address.create({
        name: location.title,
        latitude: location.lat,
        longitude: location.lon,
        place: location.title + ',' + place,
        formattedAddress: location.title + ',' + place,
        imageUrl: imageUrls,
        summary: summary.extract,
        type: category,
        city: '',
        state: '',
        country: '',
        postalCode: '',
        diff_lang: translate,
        location: {
          type: 'Point',
          coordinates: [location.lon, location.lat],
        },
        pageid: location.pageid,
      });

      io?.emit('address', data);

      // await elasticHelper.createIndex('address',data._id.toString(),data.toObject());
    } catch (error) {
      console.log(error);

    }
  }
  return;
};

const getGetCategory = async (page: any) => {

  const isTheCategoriesFunctionORNot = typeof page.categories === 'function';
  const categories = isTheCategoriesFunctionORNot?await page.categories():page.categories as WikiPage["categories"]

  let placeType = 'Other';

  const categoriesDb = await Category.find({}).lean();

  for (const category of categoriesDb) {
    if (
     isTheCategoriesFunctionORNot && categories.some((c:any) => c.toLowerCase().includes(category.name.toLowerCase()))
    ) {
      placeType = category.name;
    }
    else if(!isTheCategoriesFunctionORNot && categories.some((c:any) => c?.title?.toLowerCase().includes(category.name.toLowerCase()))){
      placeType = category.name;
    }
  }

  // if (categories.some((c:any) => c.toLowerCase().includes('museum'))) {
  //   placeType = 'Museum';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('road'))) {
  //   placeType = 'Road';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('park'))) {
  //   placeType = 'Park';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('mosque'))) {
  //   placeType = 'Mosque';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('temple'))) {
  //   placeType = 'Temple';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('church'))) {
  //   placeType = 'Church';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('market'))) {
  //   placeType = 'Market';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('stadium'))) {
  //   placeType = 'Stadium';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('university'))) {
  //   placeType = 'University';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('college'))) {
  //   placeType = 'College';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('school'))) {
  //   placeType = 'School';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('bridge'))) {
  //   placeType = 'Bridge';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('railway'))) {
  //   placeType = 'Railway Station';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('airport'))) {
  //   placeType = 'Airport';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('hospital'))) {
  //   placeType = 'Hospital';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('monument'))) {
  //   placeType = 'Monument';
  // } else if (categories.some((c:any) => c.toLowerCase().includes('building'))) {
  //   placeType = 'Building';
  // }

  return placeType;
};

export const savedLocationsInDBParrelal = async (
  locations: LocationInfo[],
  placeI?: string
) => {
  const placeArr = placeI?.split(',');
  placeArr?.reverse()?.pop();

  const place = placeArr?.join(',');

  

  try {
    const mappedData = await locations?.map(item => {
      return {
        name: item.title,
        latitude: item.lat,
        longitude: item.lon,
        place: item.title + ',' + place,
        formattedAddress: item.title + ',' + place,
        imageUrl: [],
        summary: '',
        type: 'Other',
        city: '',
        state: '',
        status: 'just',
        country: '',
        postalCode: '',
        diff_lang: '',
        location: {
          type: 'Point',
          coordinates: [item.lon, item.lat],
        },
        pageid: item.pageid,
      };
    });
    await Address.insertMany(mappedData);

    
   await kafkaProducer.sendMessage('addressUpdate', locations);
    console.log('add data in db');
    
  } catch (error) {
    console.log(error);


  }
  return;
};

export const addDetailsInExistingAddress = async (
  addresss: LocationInfo[],
  existData: boolean = true
) => {
  await wikipedia.setUserAgent('VoyazenApp/1.0 (sharif@example.com)');
  const io = (global as any).io;
  for (const address of addresss) {
    try {
      //
      
      if (!existData) {
        const exist = await Address.findOne({
          pageid: address.pageid,
          status: { $ne: 'just' },
        }).lean();
        if (exist) {
          await Address.deleteOne({ pageid: address.pageid });
          console.log('delete duplicate');

          continue;
        }

        await Address.findOneAndUpdate(
          { pageid: address.pageid },
          { status: '' },
          { new: true }
        ).lean();
      }

      
      const page = await wikipedia.page(address.pageid as any as string);
      const summary = await page.summary();

      const images = await page.images();
      const imageUrls = images
        ?.map(img => img.url)
        .filter(
          url =>
            url && ['jpg', 'png', 'jpeg'].includes(url?.split('.')?.pop() || '')
        );
      const type = await getGetCategory(page);
      const data = await Address.findOneAndUpdate(
        { pageid: address.pageid },
        {
          imageUrl: imageUrls,
          summary: summary.extract,
          type: type,
          status: '',
        },
        { new: true }
      ).lean();


      // elasticHelper.createIndex('address',data?._id.toString()!,{...data?.toObject(),diff_lang:data?.diff_lang||{demo:"demo"}});
      kafkaProducer.sendMessage('updateDescription', data);
      io.emit('address', data);
      await RedisHelper.keyDelete('address');
      await RedisHelper.keyDelete(`${data?._id}`);
      await redisClient.del(`${data?._id}`);
    } catch (error) {
      try {
              console.log('start the work');
      const page = await getCityByPageId(address.pageid as any as number);


      
      /// \n \ and etc
      console.log('start the work');
      //replace all = from summary
      const summary = page.extract?.replace(/=/g, '')?.replace(/\\n/g, '')?.slice(0, 900);
      const category = await getGetCategory(page);
      const images = [page.original?.source];

     const data = await Address.findOneAndUpdate({pageid:address.pageid},{summary:summary,imageUrl:images,type:category},{new:true})
      kafkaProducer.sendMessage('updateDescription', data);
      io.emit('address', data);
      await RedisHelper.keyDelete('address');
      await RedisHelper.keyDelete(`${data?._id}`);
      await redisClient.del(`${data?._id}`);
      console.log(`done ${address.pageid} by api`);
      
      } catch (error) {
        console.log(error);
        
      }
     
    }
  }
};

export const addLanguagesInExistingAddress = async (
  address: IAddress & { _id: string }
) => {
  try {
    const diff_lang = await translateLanguages(
      address.summary!,
      address.name,
      address.type!,
      address.formattedAddress
    );

    const data = await Address.findOneAndUpdate(
      { _id: address._id },
      { diff_lang: diff_lang },
      { new: true }
    );

    // elasticHelper.createIndex('address',data?._id.toString()!,{...data?.toObject(),diff_lang:data?.diff_lang||{demo:"demo"}});
    await RedisHelper.keyDelete(`${address._id}`);
    await redisClient.del(`${address._id}`);
  } catch (error) {
    console.log(error);
  }
};

export const addShortDescription = async (
  address: IAddress & { _id: string }
) => {
  try {


    // const shortDescription = await generateAiContnents(address.summary!,100);
    // const longDescription = await generateAiContnents(address.summary!);

    const [shortDescription, longDescription] = await Promise.all([
      generateAiContnents(address.summary! || address.name, 200),
      generateAiContnents(address.summary! || address.name),
    ]);

    const data = await Address.findOneAndUpdate(
      { _id: address._id },
      { summary: shortDescription, long_descreption: longDescription },
      { new: true }
    );

    // elasticHelper.updateIndex('address',data?._id.toString()!,{...data?.toObject(),diff_lang:data?.diff_lang||{demo:"demo"}});

    kafkaProducer.sendMessage('updateType', data);
    await RedisHelper.keyDelete(`${address._id}`);
    await redisClient.del(`${address._id}`);
  } catch (error) {
    console.log(error);
  }
};

export const addNotFoundData = async (
  lat: number,
  lon: number,
  radius = 10000
) => {
  const addresses = await Address.find(
    {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lon), Number(lat)], // lng, lat
          },
          $maxDistance: Number(radius) * 1000, // optional: in meters (e.g., 5km)
          $minDistance: 0, // optional
        },
      },
    },
    { _id: 1 }
  ).lean();

  console.log('not found runned');
  console.log(addresses.length);

  if (addresses.length > 30) return;
  const place = await getAddressFromLatLng(lat, lon);
  if (!place) return;
  const latlong = await geosearchEn(lat!, lon!, 10000, 20);

  await savedLocationsInDBParrelal(latlong, place?.fullAddress || '');
  await RedisHelper.keyDelete('address');
};

export async function getAddressFromLatLng(lat: number, lon: number) {
  try {
    const response = await axios.get('https://us1.locationiq.com/v1/reverse', {
      params: {
        key: config.locationQ.key,
        lat: lat,
        lon: lon,
        format: 'json',
        addressdetails: 1,
      },
    });

    const { display_name, address } = response.data;

    return {
      fullAddress: display_name || null,
      road: address.road || null,
      city: address.city || address.town || address.village || null,
      state: address.state || null,
      country: address.country || null,
      postcode: address.postcode || null,
    };
  } catch (error: any) {
    console.error('Error fetching address:', error.message);
    return {};
  }
}

export const addTypeInExistingAddress = async (
  address: IAddress & { _id: string }
) => {
  try {
    const type = await getTheTypeUsingAI(address.summary!);
    console.log(type);

    const data = await Address.findOneAndUpdate(
      { _id: address._id },
      { type: type },
      { new: true }
    );
    // elasticHelper.updateIndex('address',data?._id.toString()!,{...data?.toObject(),diff_lang:data?.diff_lang||{demo:"demo"}});
    await RedisHelper.keyDelete(`${address._id}`);
    await redisClient.del(`${address._id}`);
  } catch (error) {
    console.log(error);
  }
};
