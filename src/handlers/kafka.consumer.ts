import { AddressService } from "../app/modules/address/address.service";
import kafka from "../config/kafka.config";
import { addDetailsInExistingAddress, addLanguagesInExistingAddress, addShortDescription, addTypeInExistingAddress } from "../helpers/wicki";

export const addressConsumer = async () => {
    try {
            const consumer = kafka.consumer({ groupId: "address" });
    await consumer.connect();
    await consumer.subscribe({ topic: "address", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);

            await AddressService.createAddressIntoDB(data);
            
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

export const addressUpdateConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "addressUpdate" });
    await consumer.connect();
    await consumer.subscribe({ topic: "addressUpdate", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);

            // devide the load of data in 4 functions by slice 
            const length = data.length;
            
            
            await addDetailsInExistingAddress(data,false)
            
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

export const updateLangConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "updateLang" });
    await consumer.connect();
    await consumer.subscribe({ topic: "updateLang", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);
 
            
            await addLanguagesInExistingAddress(data)
            
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

export const updateDescriptionConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "updateDescription" });
    await consumer.connect();
    await consumer.subscribe({ topic: "updateDescription", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);
 
            
            await addShortDescription(data)
            
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

export const updateTypeConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "updateType" });
    await consumer.connect();
    await consumer.subscribe({ topic: "updateType", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);
 
            
           await addTypeInExistingAddress(data)
            
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}


export const handleCsvConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "csv" });
    await consumer.connect();
    await consumer.subscribe({ topic: "csv", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);
            await AddressService.addDataFromExcelSheet(data);
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

const createSingleAddressConsumer = async () => {
    try {
    const consumer = kafka.consumer({ groupId: "singleAddress" });
    await consumer.connect();
    await consumer.subscribe({ topic: "singleAddress", fromBeginning: true });
    await consumer.run({ eachBatch: async ({ batch, heartbeat,resolveOffset, commitOffsetsIfNecessary }) => {

        batch.messages.forEach(async (message) => {
            const data = JSON.parse(message.value?.toString() as string);
            await AddressService.createAddressSingleIntoDB(data);
            resolveOffset(message.offset)
        });
        await commitOffsetsIfNecessary();

        heartbeat();

    } });
    } catch (error) {
        console.log(error);
        
    }
}

export const kafkaConsumer = async () =>{
    await addressConsumer();
    await addressUpdateConsumer();
    await updateDescriptionConsumer();
    await updateTypeConsumer();
    await handleCsvConsumer(),
    await createSingleAddressConsumer()
}