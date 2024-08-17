import { TranscriptionServiceType } from "./enums/TranscriptionServiceType";

export interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  filePath?: string;
}
