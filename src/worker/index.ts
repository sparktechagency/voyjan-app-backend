import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress, addTypeInExistingAddress } from "../helpers/wicki";
import { AddressService } from "../app/modules/address/address.service";

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
    cronJob.schedule("*/15 * * * * *", async () => {
  try {
    // console.log("Cron Job Runned");

    // const finishedData = await Address.find({ summary: "" }).limit(1).lean();
    // console.log(finishedData);

    // if (finishedData.length > 0) {
    //   for (const data of finishedData) {
    //     await AddressService.singleAaddressFromDB(data._id.toString());
    //   }
    // }

    // await addDetailsInExistingAddress(finishedData as any);
    // const otherTypes = await Address.findOne({type:{$in:['','Other']}})
    // if(otherTypes){
    //   await addTypeInExistingAddress(otherTypes as any)
    // }

  } catch (error) {
    console.log(error);
  }
});
}