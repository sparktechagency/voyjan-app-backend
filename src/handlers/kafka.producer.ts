import kafka from "../config/kafka.config";

export const kafkaProducer = {
    sendMessage: async (topic: string, message: any) => {
        const producer = kafka.producer();
        await producer.connect();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        await producer.disconnect();
    },
};