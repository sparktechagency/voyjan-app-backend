import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress } from "../helpers/wicki";
import { AddressService } from "../app/modules/address/address.service";

export function startWorker() {
    cronJob.schedule("*/5 * * * *",async () => {
        try {
            console.log('Cron Job Runned');
            
            const unFinishedData = await Address.find({summary:''}).limit(10).lean();
            console.log(unFinishedData);
            
            await addDetailsInExistingAddress(unFinishedData as any);

  
        } catch (error) {
            console.log(error);
            
        }
    });

    cronJob.schedule("*/1 * * * *",async () => {
        try {
            console.log('Cron Job Runned');
            
              const finishedData = await Address.find({imageUrl:{$size:0}}).limit(1).lean();
           console.log(finishedData);
           
           if(finishedData.length > 0){
            await AddressService.singleAaddressFromDB(finishedData[0]._id as any);
            console.log('finished by ai');
           }

  
        } catch (error) {
            console.log(error);
            
        }
    });
}