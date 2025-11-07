import cronJob from "node-cron"
import { Address } from "../app/modules/address/address.model";
import { addDetailsInExistingAddress } from "../helpers/wicki";

export function startWorker() {
    cronJob.schedule("*/5 * * * *",async () => {
        try {
            console.log('Cron Job Runned');
            
            const unFinishedData = await Address.find({summary:{$exists:false}}).limit(10).lean();
            console.log(unFinishedData);
            
            await addDetailsInExistingAddress(unFinishedData as any);
        } catch (error) {
            console.log(error);
            
        }
    });
}