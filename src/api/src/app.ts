// src/app.ts
import express, { Request, Response } from 'express';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';

interface TranscriptionRequest {
  url: string;
  transcriptionType: TranscriptionServiceType;
}

interface TranscriptionResponse {
  url: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}

type TranscribeFunction = (req: TranscriptionRequest) => Promise<TranscriptionResponse>;

const createApp = (transcribe: TranscribeFunction) => {
  const app = express();

  app.use(express.json());

  const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  app.post('/transcribe', async (req: Request, res: Response) => {
    const { url, transcriptionType } = req.body;

    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
      return res.status(400).json({ error: 'Invalid transcription type' });
    }

    if (!isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
      const result = await transcribe({ url, transcriptionType });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process transcription' });
    }
  });

  return app;
};

export default createApp;
