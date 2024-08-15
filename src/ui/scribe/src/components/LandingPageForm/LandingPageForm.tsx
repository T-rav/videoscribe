import React, { useState } from 'react';
import './LandingPageForm.css';
import { useNotificationContext } from '../NotificationContext';

const LandingPageForm: React.FC = () => {
  const [videoLink, setVideoLink] = useState('');
  const [transformOption, setTransformOption] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; duration: string; transcript: string } | null>(null);
  const { addNotification } = useNotificationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    let data;

    if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
      data = {
        url: videoLink,
        transform: transformOption,
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
        transform: transformOption,
      };
    } else {
      setError('Unsupported URL. Please provide a valid YouTube or Google Drive link.');
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
        
        const structuredResult = {
          title: result.title,
          duration: result.duration,
          transcript: result.transcript,
        };
        
        // Add notification
        addNotification({
          title: structuredResult.title,
          datetime: new Date().toLocaleString(),
          length: structuredResult.duration,
          progress: 'Completed',
          transcript: structuredResult.transcript,
        });

        // Set the structured result state to display it below the button
        setResult(structuredResult);

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

  const copyToClipboard = () => {
    if (result) {
      const formattedText = `Title: ${result.title}\nDuration: ${result.duration}\n\n${result.transcript}`;
      navigator.clipboard.writeText(formattedText);
    }
  };

  const closeTranscript = () => {
    // Clear the result and input fields
    setResult(null);
    setVideoLink('');
    setTransformOption('none');
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
          placeholder="Paste YouTube or Google Drive link here"
        />

        <label htmlFor="transform-option">Transcript Transformation</label>
        <select
          id="transform-option"
          value={transformOption}
          onChange={(e) => setTransformOption(e.target.value)}
        >
          <option value="none">None</option>
          <option value="summarize" selected>Summarize</option>
          <option value="formatting" selected>Format for Readability</option>
          <option value="fillerremoval" selected>Filler Word Removal</option>
          <option value="segmentation" selected>Segmentation</option>
          <option value="keywords" selected>Keyword Extraction</option>
          <option value="translation" selected>Translation</option>
        </select>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Transcribe'}
        </button>
      </form>

      {/* Display the result below the button */}
      {result && (
        <div className="transcription-result">
          <button className="close-button" onClick={closeTranscript}>X</button>
          <h3>Title: {result.title}</h3>
          <p>Duration: {result.duration} seconds</p>
          <h4>Transcript:</h4>
          <pre>{result.transcript}</pre>
          <button className="copy-button" onClick={copyToClipboard}>Copy Transcript</button>
        </div>
      )}
    </div>
  );
};

export default LandingPageForm;
