import { TranscriptionServiceType } from '../enums/TranscriptionServiceType';

interface TranscriptionRequest {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  service?: string;
  transform?: boolean;
}

interface TranscriptionResponse {
  url?: string;
  title: string;
  duration: number;
  service?: string;
  transcriptionFilePath: string;
  transcript: string;
  transformedTranscript: string;
  transform?: boolean;
}

export const transcribe = async ({
  url,
  filePath,
  transcriptionType,
  service,
  transform,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  // Simulate a delay to mimic an external service call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock video info for demonstration purposes
  const videoInfo = {
    title: url ? "Sample Video Title" : "Unknown Title",
    duration: url ? 120 : 0, // Assuming 120 seconds for the example
  };

  // Create a mock transcription response based on whether a URL or file was provided
  let transcript: string;
  let transformedTranscript: string;

  if (url) {
    transcript = `This is a dummy transcription from the mock service for the URL: ${url}.`;
    transformedTranscript = transform ? `Transformed with ${transform}: ${transcript}` : transcript;
  } else if (filePath) {
    transcript = `This is a dummy transcription from the mock service for the file: ${filePath}.`;
    transformedTranscript = transform ? `Transformed with ${transform}: ${transcript}` : transcript;
  } else {
    throw new Error('Either url or filePath must be provided.');
  }

  // Return the mock transcription response with the new shape
  return {
    url,
    title: videoInfo.title,
    duration: videoInfo.duration,
    service,
    transcriptionFilePath: filePath || '',
    transcript,
    transformedTranscript,
    transform,
  };
};
