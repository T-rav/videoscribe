import express, { Request, Response } from 'express';
import { TranscriptionServiceType } from './enums/TranscriptionServiceType';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Function to validate YouTube URL
const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
};

// Define the API endpoint
app.post('/transcribe', (req: Request, res: Response) => {
    const { url, transcriptionType } = req.body;

    // Validate the transcriptionType
    if (!Object.values(TranscriptionServiceType).includes(transcriptionType)) {
        return res.status(400).json({ error: 'Invalid transcription type' });
    }

    // Validate the YouTube URL
    if (!isValidYouTubeUrl(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // todo : call out to python code 

    // For now, just return some dummy text
    res.json({
        message: 'Dummy transcription text',
        url: url,
        transcriptionType: transcriptionType
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
