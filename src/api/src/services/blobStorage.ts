import logger from '../utils/logger';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { StorageRequest, StorageResponse, TranscriptionMessage, TranscriptionResponse } from './interfaces/transcription';

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
  content,
  userId,
}: StorageRequest): Promise<StorageResponse> => {
  try {
    logger.log('info', `Saving job to storage for user: ${userId}`);
    const containerName = userId !== '0'
      ? process.env.AZURE_STORAGE_CONTAINER_NAME || ''
      : process.env.AZURE_STORAGE_CONTAINER_NAME_DEMO || '';
    
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    await ensureContainerExists(containerClient, containerName);

    const blobName = `$${userId}-${jobId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    let message: StorageRequest = {
      jobId,
      userId,
      content,
    };

    logger.log('info', `Publishing storage artifacts for ${jobId}`);
    const data = JSON.stringify(message);
    await blockBlobClient.upload(data, data.length);
    logger.log('info', `Message published to blob storage. Blob name: ${blobName}`);

    return { jobId, blobName: `${containerName}/${blobName}` };
  } catch (error) {
    logger.error(`Failed to publish message to blob storage. Error: ${error}`);
    throw new Error(`Failed to publish message to blob storage: ${error}`);
  }
};
