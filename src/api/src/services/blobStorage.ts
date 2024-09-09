import logger from '../utils/logger';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { StorageResponse, TranscriptionMessage, TranscriptionResponse } from './interfaces/transcription';

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
}: TranscriptionMessage): Promise<StorageResponse> => {
  try {
    logger.log('info', `Saving job to storage for user: ${userId}`);
    const containerName = userId !== '0'
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
    logger.log('info', `Message published to blob storage. Blob name: ${blobName}`);

    return { jobId, blobName };
  } catch (error) {
    logger.error(`Failed to publish message to blob storage. Error: ${error}`);
    throw new Error(`Failed to publish message to blob storage: ${error}`);
  }
};
