import cronJob from 'node-cron';
import { Address } from '../app/modules/address/address.model';
import {
  addDetailsInExistingAddress,
  addTypeInExistingAddress,
} from '../helpers/wicki';
import { AddressService } from '../app/modules/address/address.service';
import { Category } from '../app/modules/category/category.model';
import { fixTypeUsingAI } from '../helpers/generateDescriptions';
import { singleTextTranslationWithLibre } from '../helpers/translateHelper';
import { esClient } from '../config/elasticSearch.config';
import { safeObjectId } from '../helpers/mongoIdChecker';

export function startWorker() {
  // cronJob.schedule("*/5 * * * *",async () => {
  //     try {
  //         console.log('Cron Job Runned');

  //         const unFinishedData = await Address.find({summary:''}).limit(10).lean();
  //         console.log(unFinishedData);

  //         await addDetailsInExistingAddress(unFinishedData as any);

  //     } catch (error) {
  //         console.log(error);

  //     }
  // });

  // run every 15 seconds
  cronJob.schedule('*/10 * * * * *', async () => {
    try {
      console.log('error from cron job');

      await restoreCategoryData();
      await restoreLang();
      // await addCategory();

      console.log('Cron Job Runned');
    } catch (error) {
      console.log(error);
    }
  });

  // cron job after every 10 minutes
  cronJob.schedule('*/10 * * * *', async () => {
    try {
      // get 10 miniutes ago data of address
      const addresses = await Address.find({
        createdAt: {
          $gte: new Date(Date.now() - 10 * 60 * 1000),
        },
        type:'Other',
      }).lean().limit(100);
      const plainAddresses = addresses.map((addr) => ({
        _id: addr._id.toString(),
        summary: addr.summary,
      }));
      const types = await fixTypeUsingAI(plainAddresses as any);
      if (types.length < 1) return;
      await implementType(types as any);
    } catch (error) {
      console.log(error);
    }
  });
}

const restoreLang = async () => {
  try {
    const finishedData = await Address.find({
      $or: [{ diff_lang: '' }, { diff_lang: { $exists: false } }],
      address_add: true,
      summary:{ $ne: '' }
    })
      .limit(1)
      .lean();
      

    if (finishedData.length > 0) {
      for (const data of finishedData) {
        // a buffer time for reduce the rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!data._id || !safeObjectId(data._id.toString())) {
          continue;
        }
        
        await AddressService.singleAaddressFromDB(data._id.toString());
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const restoreCategoryData = async () => {
  try {
    const categories = await Category.find({}).lean();

    const unFinishedData = await Address.find(
      {
        type: { $nin: categories.map(c => c.name) },
        address_add: { $exists: false },
      },
      { _id: 1, summary: 1, diff_lang: 1 }
    )
      .limit(10)
      .sort({ createdAt: -1 })
      .lean();

    const leanData = unFinishedData.map(d => ({
      _id: d._id.toString(),
      summary: d.summary,
    }));
    if (leanData.length > 0) {
      const types = await fixTypeUsingAI(leanData as any);
      if(types.length<1) return
      await implementType(types as any);
    }
  } catch (error) {
    console.log(error);
  }
};

async function implementType(data: { _id: string; type: string }[]) {
  try {
    await Promise.all(
      data.map(async d => {
        console.log(d._id);
        
        if(!safeObjectId(d._id)) return
        await new Promise(resolve => setTimeout(resolve, 1000));
        const translateLang = await singleTextTranslationWithLibre(
          d.type,
          'en'
        )!;

        if (!translateLang) {
          return;
        }
        const diff_lang = await Address.findOne(
          { _id: d._id },
          { diff_lang: 1 }
        ).lean();
        let translateDiffLang = diff_lang?.diff_lang;

        if (!translateDiffLang) {
          return await Address.updateOne(
            { _id: d._id },
            { $set: { type: d.type } }
          );
        }

        for (const key in translateDiffLang! as any) {
          translateDiffLang[key] = {
            ...translateDiffLang[key],
            type: translateLang?.[key]!,
          };
        }

        await Address.updateOne(
          { _id: d._id },
          { $set: { type: d.type, diff_lang: translateDiffLang } }
        );
      })
    );

    console.log(`${data.length} types implemented`);
  } catch (error) {
    console.log(error);
  }
}

async function addCategory() {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const unFinishedData = await Address.find({
      createdAt: { $lte: twentyMinutesAgo },
      $or: [
        { type: { $exists: false } },
        { type: "Other" },
      ],
    })
      .limit(10)
      .lean();

    if (unFinishedData.length < 1) return;

    const data = await fixTypeUsingAI(unFinishedData as any);
    if (data.length < 1) return;

    await implementType(data as any);
  } catch (error) {
    console.log(error);
  }
}


export async function BulkUpdateAddress() {
  try {
    // bull delete all data in elasticsearch index
    await esClient.deleteByQuery({
      index: 'address',
      body: {
        query: {
          match_all: {},
        },
      },
    });
    console.log('Deleted all data from elasticsearch index');
    const allAddresses = await Address.find({}).lean();
    console.log(`Found ${allAddresses.length} addresses in database`);
    //create address index if not exists
    const indexExists = await esClient.indices.exists({ index: 'address' });
    if (!indexExists) {
      await esClient.indices.create({ index: 'address' });
      console.log('Created address index in elasticsearch');
    }
    // bulk insert all addresses to elasticsearch chunks of 1000
    const chunkSize = 100;
    for (let i = 0; i < allAddresses.length; i += chunkSize) {
      const chunk = allAddresses.slice(i, i + chunkSize);
      const body = chunk.flatMap(doc => [
        { index: { _index: 'address', _id: doc._id.toString() } },
        doc,
      ]);
      
      await esClient.bulk({ refresh: true, body });
      console.log(`Inserted ${i + chunk.length} / ${allAddresses.length}`);
    }
    console.log('Bulk update to elasticsearch completed');
   
  } catch (error) {
    console.error(error);
  }
 
}
