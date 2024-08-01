import express, { Request, Response } from 'express';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Define the API endpoint
app.post('/transcribe', (req: Request, res: Response) => {
    const { url, transcriptionType } = req.body;

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
