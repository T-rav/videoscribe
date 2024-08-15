import { spawn } from 'child_process';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

interface TranscriptionRequest {
  url: string;
  transcriptionType: TranscriptionServiceType;
}

interface TranscriptionResponse {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}

export const transcribe = async ({
  url,
  transcriptionType,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  return new Promise((resolve, reject) => {
    let scriptArgs: string[] = [];

    // Log the input parameters
    logger.log('info', `Received transcription request with URL: ${url} and Transcription Type: ${transcriptionType}`);

    if (url) {
      scriptArgs.push(url);
    } else {
      return reject(new Error('Either URL or file must be provided'));
    }

    scriptArgs.push('--service', transcriptionType, '--path', './incoming');

    const python = spawn('python3', ['../translator/app.py', ...scriptArgs]);

    python.stdin.end();

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      } else {
        try {
          const parsedOutput = JSON.parse(output) as TranscriptionResponse;
          resolve(parsedOutput);
        } catch (error) {
          reject(new Error(`Failed to parse Python script output: ${errorOutput} - [${output}]`));
        }
      }
    });
  });
};
