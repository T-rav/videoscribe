import { TranscriptionServiceType } from '../../enums/TranscriptionServiceType';
import { TranscriptionTransformation } from '../../enums/TranscriptionTransformations';

export interface TranscriptionRequest {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
}

export interface TranscriptionMessage {
  jobId: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
  isFile: boolean;
  content: string;
  userId?: string;
  mimeType?: string;
  fileName?: string;
}

export interface TranscriptionResponse {
  jobId: string;
}