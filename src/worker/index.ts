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

      console.log('Cron Job Runned');
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

const   restoreCategoryData = async () => {
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

export async function BulkUpdateAddress() {
  try {
    // const allData = await Address.find({}, { type: 1 }).lean();

    // const chunkSize = 1000; // change as needed
    // for (let i = 0; i < allData.length; i += chunkSize) {
    //   const chunk = allData.slice(i, i + chunkSize);

    //   const mapData = chunk.flatMap(d => [
    //     { update: { _index: 'address', _id: d._id.toString() } },
    //     { doc: { type: d.type } },
    //   ]);

    //   const res = await esClient.bulk({ body: mapData });

    //   console.log(
    //     `Chunk ${i / chunkSize + 1}: processed ${chunk.length} documents`
    //   );

    //   if (res.errors) {
    //     console.error('Bulk update errors:', res.items);
    //   }
    // }

    // console.log('Bulk update completed');

   
  } catch (error) {
    console.error(error);
  }
 
}
