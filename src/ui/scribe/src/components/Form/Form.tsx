import React, { useState } from 'react';
import './Form.css';
import { useNotificationContext } from '../NotificationContext';

const Form: React.FC = () => {
  const [videoLink, setVideoLink] = useState('');
  const [transcriptionType, setTranscriptionType] = useState('openai');
  const [transcriptionPrompt, setTranscriptionPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let data;

    if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
      data = {
        url: videoLink,
        transcriptionType: transcriptionType,
      };
    } else if (videoLink.includes('vimeo.com')) {
      data = {
        url: videoLink,
        transcriptionType: transcriptionType,
      };
    } else if (videoLink.includes('drive.google.com')) {
      const fileIdMatch = videoLink.match(/\/d\/(.*?)\//);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (!fileId) {
        setError('Invalid Google Drive URL.');
        setLoading(false);
        return;
      }

      data = {
        url: `https://drive.google.com/uc?export=download&id=${fileId}`,
        transcriptionType: transcriptionType,
      };
    } else {
      setError('Unsupported URL. Please provide a valid YouTube, Vimeo, or Google Drive link.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription Result:', result);

        // Add notification
        addNotification({
          title: result.title,
          datetime: new Date().toLocaleString(),
          length: result.duration,
          progress: 'Completed',
          transcript: result.transcript
        });

      } else {
        const error = await response.json();
        setError(error.error || response.statusText);
      }
    } catch (error) {
      setError('An error occurred while processing the request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Transcribe Videos</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="video-link">Video Link</label>
        <input
          type="text"
          id="video-link"
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value)}
          placeholder="Paste YouTube, Vimeo, or Google Drive link here"
        />

        <label htmlFor="transcription-type">Transcription Type</label>
        <select
          id="transcription-type"
          value={transcriptionType}
          onChange={(e) => setTranscriptionType(e.target.value)}
        >
          <option value="openai">Text</option>
          <option value="openai-vtt">VTT</option>
          <option value="openai-srt">SRT</option>
        </select>

        <label htmlFor="transcription-prompt">Transcription Prompt</label>
        <textarea
          id="transcription-prompt"
          value={transcriptionPrompt}
          onChange={(e) => setTranscriptionPrompt(e.target.value)}
          placeholder="Enter a prompt for the transcription (Optional)"
          rows={3}
        ></textarea>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Transcribe'}
        </button>
      </form>
    </div>
  );
};

export default Form;
