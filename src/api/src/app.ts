// src/app.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';

interface TranscriptionRequest {
  url?: string;
  transcriptionType: TranscriptionServiceType;
  filePath?: string;
}

interface TranscriptionResponse {
  url?: string;
  filePath?: string;
  transcriptionType: TranscriptionServiceType;
  transcription: string;
}

type TranscribeFunction = (req: TranscriptionRequest) => Promise<TranscriptionResponse>;

const createApp = (transcribe: TranscribeFunction) => {
  const app = express();
  const upload = multer({ dest: 'temp-uploads/' }); // Temporary upload directory

  app.use(cors());
  app.use(express.json());

  const isValidUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtube\.com|youtu\.?be)\/(watch\?v=|embed\/|v\/|.+\?v=|live\/|shorts\/)?([a-zA-Z0-9_-]{11})$/;
    const googleDriveRegex = /^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/(file\/d\/|present\/d\/|uc\?(export=download&)?id=)([a-zA-Z0-9_-]+)(\/view)?$/;
    return youtubeRegex.test(url) || googleDriveRegex.test(url);
  };

  app.post('/transcribe_link', async (req: Request, res: Response) => {
    const { url, transcriptionType } = req.body;

    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
      return res.status(400).json({ error: 'Invalid transcription type' });
    }

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL. It needs to be a valid YouTube or Google Drive URL' });
    }

    try {
      const result = await transcribe({ url, transcriptionType });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process transcription ' + error });
    }
  });

  app.post('/transcribe_file', upload.single('file'), async (req: Request, res: Response) => {
    const { transcriptionType } = req.body;
    const file = req.file;

    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
      return res.status(400).json({ error: 'Invalid transcription type' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Define the directory where you want to store uploaded files
    const uploadsDir = path.resolve('uploads');
    const filePath = path.join(uploadsDir, file.originalname);

    try {
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      // Move the file from the temporary location to the final destination
      fs.renameSync(file.path, filePath);

      // Pass the file path to the transcribe function
      const result = await transcribe({ transcriptionType, filePath });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process transcription ' + error });
    }
  });

  return app;
};

export default createApp;
