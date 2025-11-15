import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress, addTypeInExistingAddress } from "../helpers/wicki";
import { AddressService } from "../app/modules/address/address.service";
import { elasticHelper } from "../handlers/elasticSaveData";

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
    cronJob.schedule("*/5 * * * * *", async () => {
  try {
    // console.log("Cron Job Runned");

    // const finishedData = await Address.find({ diff_lang: "" }).limit(1).lean();
    // console.log(finishedData);

    // if (finishedData.length > 0) {
    //   for (const data of finishedData) {
    //     await AddressService.singleAaddressFromDB(data._id.toString());
    //   }
    // }

    // const allAddresss = await Address.find({}).lean();

    // for (const data of allAddresss) {
    //    await elasticHelper.createIndex('address',data?._id.toString()!,{...data,diff_lang:data?.diff_lang||{demo:"demo"}});
    // }

    // console.log('done');
    
    // await addDetailsInExistingAddress(finishedData as any);
    // const otherTypes = await Address.findOne({type:{$in:['','Other']}})
    // if(otherTypes){
    //   await addTypeInExistingAddress(otherTypes as any)
    // }

    console.log("Cron Job Runned");

  } catch (error) {
    console.log(error);
  }
});
}