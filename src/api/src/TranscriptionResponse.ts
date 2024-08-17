import { TranscriptionServiceType } from "./enums/TranscriptionServiceType";

export interface TranscriptionResponse {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}
