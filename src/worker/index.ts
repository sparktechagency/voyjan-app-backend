import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress, addTypeInExistingAddress } from "../helpers/wicki";
import { AddressService } from "../app/modules/address/address.service";

export async function startWorker() {
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

    const address = await Address.find()
    if (address.length > 0) {
      for (const data of address) {
        //remove all = from summury field
        const summary = data.summary?.replace(/=/g, '');
        const long_descreption = data.long_descreption?.replace(/=/g, '');
        let diff_lang = {...data?.diff_lang as any}
       Object.keys(data?.diff_lang!).map((key) =>{
        diff_lang[key]={
          title:data?.diff_lang![key as any].title?.replace(/=/g, ''),
          translateText:data?.diff_lang![key as any].translateText?.replace(/=/g, ''),
          translateLong:data?.diff_lang![key as any].translateLong?.replace(/=/g, ''),
          address:data?.diff_lang![key as any].address?.replace(/=/g, ''),
        }
       });
        await Address.findOneAndUpdate({ _id: data._id }, { summary: summary, long_descreption: long_descreption, diff_lang: diff_lang }, { new: true });
        console.log(`Cron Job Runned for ${data._id}`);
      }
    }

    // run every 15 seconds
//     cronJob.schedule("*/1 * * * * *", async () => {
//   try {
//     // console.log("Cron Job Runned");

//     // const finishedData = await Address.find({ diff_lang:""}).limit(1).lean();
//     // console.log(finishedData);

//     // if (finishedData.length > 0) {
//     //   for (const data of finishedData) {
//     //     await AddressService.singleAaddressFromDB(data._id.toString());
//     //   }
//     // }

//     const address = await Address.find()
//     if (address.length > 0) {
//       for (const data of address) {
//         await AddressService.singleAaddressFromDB(data._id.toString());
//       }
//     }

    

//     // await addDetailsInExistingAddress(finishedData as any);
//     // const otherTypes = await Address.findOne({type:{$in:['','Other']}})
//     // if(otherTypes){
//     //   await addTypeInExistingAddress(otherTypes as any)
//     // }

//     console.log("Cron Job Runned");
//   } catch (error) {
//     console.log(error);
//   }
// });
}