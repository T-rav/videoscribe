// src/services/pythonService.ts
import { spawn } from 'child_process';
import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';

interface TranscriptionRequest {
  url: string;
  transcriptionType: TranscriptionServiceType;
}

interface TranscriptionResponse {
  url: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}

export const transcribe = async ({
  url,
  transcriptionType,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  return new Promise((resolve, reject) => {
    // '--prompt', 'TODO: Prompt goes here'
    const python = spawn('python3', ['../translator/app.py', url, '--service', transcriptionType, '--path', './incoming' ]);

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
