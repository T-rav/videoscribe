// src/services/mockService.ts
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
  // Simulate a delay to mimic an external service call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Return a dummy transcription response
  return {
    url,
    transcriptionType,
    transcription: 'This is a dummy transcription from the mock service.',
  };
};
