// src/app.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
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

  // Enable CORS for specific origin
  // const corsOptions = {
  //   origin: 'http://localhost:3000',
  //   optionsSuccessStatus: 200, // For legacy browser support
  // };

  app.use(cors());
  app.use(express.json());

  const isValidUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
    const vimeoRegex = /^(https?:\/\/)?(vimeo\.com)\/([0-9]+)$/;
    return youtubeRegex.test(url) || googleDriveRegex.test(url) || vimeoRegex.test(url);
  };

  app.post('/transcribe', async (req: Request, res: Response) => {
    const { url, transcriptionType } = req.body;

    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
      return res.status(400).json({ error: 'Invalid transcription type' });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube, Vimeo or Google Drive URL' });
    }

    try {
      const result = await transcribe({ url, transcriptionType });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process transcription ' + error });
    }
  });

  return app;
};

export default createApp;
