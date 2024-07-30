import React, { useState } from 'react';
import './Form.css';

const Form: React.FC = () => {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [transcriptionType, setTranscriptionType] = useState('normal');
  const [transcriptionPrompt, setTranscriptionPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('https://<your-azure-web-app-name>.azurewebsites.net/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeLink,
          transcriptionType,
          transcriptionPrompt,
        }),
      });
      const data = await response.json();
      console.log(data);
      // Handle the response data as needed
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="form-container">
      <h2>Transcribe YouTube Videos</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="youtube-link">YouTube Link</label>
        <input
          type="text"
          id="youtube-link"
          placeholder="Paste YouTube link here"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />

        <label htmlFor="transcription-type">Transcription Type</label>
        <select
          id="transcription-type"
          value={transcriptionType}
          onChange={(e) => setTranscriptionType(e.target.value)}
        >
          <option value="normal">Normal</option>
          <option value="vtt">VTT</option>
          <option value="str">STR</option>
        </select>

        <label htmlFor="transcription-prompt">Transcription Prompt</label>
        <textarea
          id="transcription-prompt"
          placeholder="Enter a prompt for the transcription (Optional)"
          value={transcriptionPrompt}
          onChange={(e) => setTranscriptionPrompt(e.target.value)}
          rows={3}
        ></textarea>

        <button type="submit" className="submit-button">
          Transcribe
        </button>
      </form>
    </div>
  );
};

export default Form;
