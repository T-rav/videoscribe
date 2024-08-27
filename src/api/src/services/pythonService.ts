import { spawn } from 'child_process';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import logger from '../utils/logger';
import { TranscriptionTransformation } from '../enums/TranscriptionTransformations';
import fs from 'fs';
import path from 'path';
import { BlobServiceClient } from '@azure/storage-blob';

interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
  filePath?: string; // Added filePath for local file uploads
}

interface TranscriptionResponse {
  url?: string;
  title: string;
  duration: number;
  transcription_file_path: string;
  service: string;
  transcription: string;
  transformed_transcript: string;
  transform: string;
}

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');

export const transcribe = async ({
  url,
  transcriptionType,
  transform,
  filePath,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      const containerClient = blobServiceClient.getContainerClient('transcriptions');
      const blobName = `transcription-${Date.now()}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      let message: any = {
        transcriptionType,
        transform,
        isFile: false, // Default to false
      };

      if (url) {
        message.url = url;
      } else if (filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        message.file = fileBuffer.toString('base64');
        message.isFile = true; // Set to true if file is provided
      } else {
        return reject(new Error('Either URL or file must be provided'));
      }

      // Log the input parameters
      logger.log('info', `Publishing transcription request with URL: ${url} and Transcription Type: ${transcriptionType} and Transform: ${transform}`);

      const data = JSON.stringify(message);
      await blockBlobClient.upload(data, data.length);

      resolve({
        url,
        title: '',
        duration: 0,
        transcription_file_path: blobName,
        service: transcriptionType,
        transcription: '',
        transformed_transcript: '',
        transform: transform.toString(),
      });
    } catch (error) {
      logger.error(`Failed to publish message to blob storage. Error: ${error}`);
      reject(new Error(`Failed to publish message to blob storage: ${error}`));
    }
  });
};
