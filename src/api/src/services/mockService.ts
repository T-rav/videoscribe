import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';

interface TranscriptionRequest {
  url?: string;
  filePath?: string;
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
  filePath,
  transcriptionType,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  // Simulate a delay to mimic an external service call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create a mock transcription response based on whether a URL or file was provided
  let transcription: string;

  if (url) {
    transcription = `This is a dummy transcription from the mock service for the URL: ${url}.`;
  } else if (filePath) {
    transcription = `This is a dummy transcription from the mock service for the file: ${filePath}.`;
  } else {
    throw new Error('Either url or filePath must be provided.');
  }

  // Return the mock transcription response
  return {
    url,
    filePath,
    transcriptionType,
    transcription,
  };
};
