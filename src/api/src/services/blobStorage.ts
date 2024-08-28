import logger from '../utils/logger';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { TranscriptionMessage, TranscriptionResponse } from './interfaces/transcription';

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');

const ensureContainerExists = async (containerClient: ContainerClient, containerName: string) => {
  if (!containerName) {
    throw new Error('Container name is required');
  }
  const containerExists = await containerClient.exists();
  if (!containerExists) {
    logger.log('info', `Container ${containerName} does not exist. Creating it...`);
    await containerClient.create();
    logger.log('info', `Container ${containerName} created successfully.`);
  }
};

export const saveJobToStorage = async ({
  jobId,
  transcriptionType,
  transform,
  isFile,
  content,
  userId,
}: TranscriptionMessage): Promise<TranscriptionResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      const containerName = userId
        ? process.env.AZURE_STORAGE_CONTAINER_NAME || ''
        : process.env.AZURE_STORAGE_CONTAINER_NAME_DEMO || '';
      
      const containerClient = blobServiceClient.getContainerClient(containerName);
      
      await ensureContainerExists(containerClient, containerName);

      const blobName = `${jobId}-transcription.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      let message: TranscriptionMessage = {
        jobId,
        transcriptionType,
        transform,
        isFile,
        content,
        userId,
      };

      logger.log('info', `Publishing transcription request for Transcription Type: ${transcriptionType} and Transform: ${transform}`);

      const data = JSON.stringify(message);
      await blockBlobClient.upload(data, data.length);

      // todo : clean this up to return a call back url to the client to check the status of the transcription
      resolve({
        title: '',
        duration: 0,
        service: transcriptionType,
        transcript: '', 
        transformedTranscript: '',
        transform: transform.toString(),
      });
    } catch (error) {
      logger.error(`Failed to publish message to blob storage. Error: ${error}`);
      reject(new Error(`Failed to publish message to blob storage: ${error}`));
    }
  });
};
