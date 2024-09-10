export interface TranscriptionUpdate {
    jobId: string;
    status: string;
    error?: string;
    title?: string;
    duration?: number;
    blobUrl?: string;
    transcript?: string;
    transformed?: string;
}