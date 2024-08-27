import { TranscriptionServiceType } from '../../enums/TranscriptionServiceType';
import { TranscriptionTransformation } from '../../enums/TranscriptionTransformations';

export interface TranscriptionRequest {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
}

export interface TranscriptionMessage {
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
  isFile: boolean;
  content: string;
}

export interface TranscriptionResponse {
  url?: string;
  title: string;
  duration: number;
  transcript: string;
  transformedTranscript: string;
  service: string;
  transform: string;
}