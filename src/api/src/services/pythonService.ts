import { spawn } from 'child_process';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import logger from '../utils/logger';
import { TranscriptionTransformation } from '../enums/TranscriptionTransformations';

interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
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

export const transcribe = async ({
  url,
  transcriptionType,
  transform,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  return new Promise((resolve, reject) => {
    let scriptArgs: string[] = [];

    // Log the input parameters
    logger.log('info', `Received transcription request with URL: ${url} and Transcription Type: ${transcriptionType} and Transform: ${transform}`);

    if (url) {
      scriptArgs.push(url);
    } else {
      return reject(new Error('Either URL or file must be provided'));
    }

    scriptArgs.push('--service', transcriptionType, '--transform', transform, '--path', './incoming');

    const python = spawn('python', ['../translator/app.py', ...scriptArgs]);

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
        logger.error(`Python script exited with code ${code}: ${errorOutput}`);
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      } else {
        try {
          const parsedOutput = JSON.parse(output) as TranscriptionResponse;
          resolve(parsedOutput);
        } catch (error) {
          logger.error(`Failed to parse Python script output. Raw output: ${output}. Error: ${error}`);
          reject(new Error(`Failed to parse Python script output: ${errorOutput} - [${output}]`));
        }
      }
    });
  });
};
