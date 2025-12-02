import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress, addTypeInExistingAddress } from "../helpers/wicki";
import { AddressService } from "../app/modules/address/address.service";
import { Category } from "../app/modules/category/category.model";
import { fixTypeUsingAI } from "../helpers/generateDescriptions";
import { singleTextTranslationWithLibre } from "../helpers/translateHelper";

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
    cronJob.schedule("* * * * *", async () => {
  try {
    // console.log("Cron Job Runned");

    // const finishedData = await Address.find({ diff_lang: "" }).limit(1).lean();
    // // console.log(finishedData);

    // if (finishedData.length > 0) {
    //   for (const data of finishedData) {
    //     await AddressService.singleAaddressFromDB(data._id.toString());
    //   }
    // }

    const categories = await Category.find({}).lean();

    const unFinishedData = await Address.find({type:{$nin:categories.map(c => c.name)},diff_lang:{$ne:""}},{_id:1,summary:1,diff_lang:1}).limit(20).lean();
    
    
    const leanData = unFinishedData.map((d) => ({ _id: d._id.toString(), summary: d.summary,}));
    if(leanData.length > 0){
      const types = await fixTypeUsingAI(leanData as any);
      
      await implementType(types as any);
    }
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


async function implementType(data:{_id:string,type:string}[]){
  await Promise.all(data.map(async (d) => {
    const translateLang = await singleTextTranslationWithLibre(d.type,'en')!

   if(!translateLang){
     return
   }
    const diff_lang = await Address.findOne({_id:d._id},{diff_lang:1}).lean()
    let translateDiffLang = diff_lang?.diff_lang
 
    
    if(!translateDiffLang){
      return await Address.updateOne({_id:d._id},{$set:{type:d.type}})
    }

    for(const key in translateDiffLang! as any){

   
      
      translateDiffLang[key] = {
        ...translateDiffLang[key],
        type:translateLang?.[key]!
      }
    }

    await Address.updateOne({_id:d._id},{$set:{type:d.type,diff_lang:translateDiffLang}})
  
   
  }))


  console.log(`${data.length} types implemented`);
}