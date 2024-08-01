import request from 'supertest';
import express, { Request, Response } from 'express';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';

const app = express();

app.use(express.json());

const isValidYouTubeUrl = (url: string): boolean => {
  const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
  return regex.test(url);
};

app.post('/transcribe', (req: Request, res: Response) => {
  const { url, transcriptionType } = req.body;

  if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
    return res.status(400).json({ error: 'Invalid transcription type' });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  res.json({
    message: 'Dummy transcription text',
    url: url,
    transcriptionType: transcriptionType,
  });
});

describe('POST /transcribe', () => {
  it('should return dummy transcription text for valid YouTube URL and transcription type', async () => {
    const response = await request(app)
      .post('/transcribe')
      .send({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        transcriptionType: 'openai',
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Dummy transcription text',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      transcriptionType: 'openai',
    });
  });

  it('should return an error for invalid transcription type', async () => {
    const response = await request(app)
      .post('/transcribe')
      .send({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        transcriptionType: 'invalid-type',
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid transcription type',
    });
  });

  it('should return an error for invalid YouTube URL', async () => {
    const response = await request(app)
      .post('/transcribe')
      .send({
        url: 'http://example.com',
        transcriptionType: 'openai',
      });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid YouTube URL',
    });
  });
});
