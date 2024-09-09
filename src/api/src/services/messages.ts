import { TranscriptionMessage } from "./interfaces/transcription";

const { ServiceBusClient } = require('@azure/service-bus');

// Create a Service Bus client
const connectionString = "your-service-bus-connection-string";
const queueName = "blob-processing-jobs";
const serviceBusClient = new ServiceBusClient(connectionString);
const sender = serviceBusClient.createSender(queueName);

async function createJob(toSend: TranscriptionMessage) {
    const message = {
        body: toSend,
        contentType: 'application/json'
    };
    await sender.sendMessages(message);
    console.log('Job sent to Service Bus:', message.body);
}
