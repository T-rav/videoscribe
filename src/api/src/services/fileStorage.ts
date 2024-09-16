import logger from '../utils/logger';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

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

export const uploadToBlobStorage = async (userId: string, jobId: string, data: Buffer): Promise<string> => {
  const containerName = userId !== '0'
    ? process.env.AZURE_STORAGE_CONTAINER_NAME || ''
    : process.env.AZURE_STORAGE_CONTAINER_NAME_DEMO || '';
  
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  await ensureContainerExists(containerClient, containerName);

  const blobName = `${userId}-${jobId}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(data, data.length);
  logger.info('info', `Message published to blob storage. Blob name: ${blobName}`);

  return `${containerName}/${blobName}`;
};
