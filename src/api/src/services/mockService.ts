import { TranscriptionRequest, TranscriptionMessage, TranscriptionResponse } from './interfaces/transcription';

export const transcribe = async ({
  url,
  filePath,
  transcriptionType,
  transform,
}: TranscriptionRequest): Promise<TranscriptionResponse> => {
  // Simulate a delay to mimic an external service call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let message: TranscriptionMessage = {
    transcriptionType,
    transform,
    isFile: false,
    content: '',
    jobId: '',
    userId: ''
  };

  if (url) {
    message.content = url;
  } else if (filePath) {
    message.content = `mock_file_content_for_${filePath}`;
    message.isFile = true;
  } else {
    throw new Error('Either url or filePath must be provided.');
  }

  // Mock video info for demonstration purposes
  const videoInfo = {
    title: message.isFile ? "Unknown Title" : "Sample Video Title",
    duration: message.isFile ? 0 : 120, // Assuming 120 seconds for URL example
  };

  // Create a mock transcription response
  const transcript = `This is a dummy transcription from the mock service for the ${message.isFile ? 'file' : 'URL'}: ${message.content}.`;
  const transformedTranscript = `Transformed with ${transform}: ${transcript}`;

  // Return the mock transcription response
  return {
    url: message.isFile ? undefined : message.content,
    title: videoInfo.title,
    duration: videoInfo.duration,
    transcript,
    transformedTranscript,
    service: message.transcriptionType,
    transform: message.transform,
  };
};
