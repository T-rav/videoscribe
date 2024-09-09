import { TranscriptionServiceType } from "src/enums/TranscriptionServiceType";
import { TranscriptionTransformation } from "src/enums/TranscriptionTransformations";

export interface JobMessage {
    jobId: string;
    transcriptionType: TranscriptionServiceType;
    transform: TranscriptionTransformation;
    isFile: boolean;
    content: string;
    userId: string;
  }