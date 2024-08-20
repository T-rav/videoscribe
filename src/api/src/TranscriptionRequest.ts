import { TranscriptionServiceType } from "./enums/TranscriptionServiceType";
import { TranscriptionTransformation } from "./enums/TranscriptionTransformations";

export interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  transform: TranscriptionTransformation;
  filePath?: string;
}
