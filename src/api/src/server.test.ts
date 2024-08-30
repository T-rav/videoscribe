// src/app.test.ts
import request from 'supertest';
import createApp from './app';
import { transcribe } from './services/mockService';

const app = createApp(transcribe);

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
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      transcriptionType: 'openai',
      transcription: 'This is a dummy transcription from the mock service.',
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
