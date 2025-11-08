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
            
              const finishedData = await Address.find({summary:''}).limit(10).lean();
           console.log(finishedData);
           
           if(finishedData.length > 0){
            const CUNK_SIZE =3;
            for (let i = 0; i < finishedData.length; i += CUNK_SIZE) {
                const chunk = finishedData.slice(i, i + CUNK_SIZE);
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(chunk);
                    }, 3000);
                })
               await Promise.all(chunk.map((data: any) => AddressService.singleAaddressFromDB(data._id.toString())));
            }
           }

  
        } catch (error) {
            console.log(error);
            
        }
    });
}