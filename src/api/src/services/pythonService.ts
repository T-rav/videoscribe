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
    const python = spawn('python3', ['transcriber.py']); // todo :fix path
    const inputData = JSON.stringify({ url, transcriptionType });

    python.stdin.write(inputData);
    python.stdin.end();

    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to process transcription'));
      } else {
        resolve(JSON.parse(output));
      }
    });
  });
};
