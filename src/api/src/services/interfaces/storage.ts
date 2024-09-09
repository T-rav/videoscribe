export interface StorageResponse {
    jobId: string;
    blobName: string;
  }
  
  export interface StorageRequest {
    jobId: string;
    userId: string;
    content: string;
    mimeType: string;
    fileName: string;
  }