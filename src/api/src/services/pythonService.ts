// src/services/pythonService.ts
import { spawn } from 'child_process';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';
import path from 'path';
import fs from 'fs';

interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  file?: Express.Multer.File;
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
  file,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  return new Promise((resolve, reject) => {
    let scriptArgs: string[] = [];
    let filePath: string | undefined;

    if (url) {
      scriptArgs.push(url);
    } else if (file) {
      // Determine the file path and move the file to a specific location
      filePath = path.resolve('uploads', file.originalname);

      // Rename/move the file to the desired location
      fs.renameSync(file.path, filePath);

      // Use the file path as the URL argument for the Python script
      scriptArgs.push(filePath);
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
          const parsedOutput = JSON.parse(output);
          resolve(parsedOutput);
        } catch (error) {
          reject(new Error(`Failed to parse Python script output: ${errorOutput} - [${output}]`));
        }
      }
    });
  });
};
