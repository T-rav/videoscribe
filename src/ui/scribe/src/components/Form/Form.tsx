import React, { useState } from 'react';
import './Form.css';

const Form: React.FC = () => {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [transcriptionType, setTranscriptionType] = useState('groq');
  const [transcriptionPrompt, setTranscriptionPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      url: youtubeLink,
      transcriptionType: transcriptionType,
    };

    console.log('Submitting form with data:', data);

    try {
      const response = await fetch('http://localhost:3001/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response:', response);

      if (response.ok) {
        const result = await response.json();
        console.log('Transcription Result:', result);
        // Handle the result here (e.g., display it in the UI or store it in state)
      } else {
        const error = await response.json();
        console.error('Error:', error.error || response.statusText);
        // Handle the error here (e.g., display an error message)
      }
    } catch (error) {
      console.error('Error:', error);
      // Handle the error here (e.g., display an error message)
    } finally {
      setLoading(false);
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
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          placeholder="Paste YouTube link here"
        />

        <label htmlFor="transcription-type">Transcription Type</label>
        <select
          id="transcription-type"
          value={transcriptionType}
          onChange={(e) => setTranscriptionType(e.target.value)}
        >
          <option value="groq">Quick</option>
          <option value="openai">Good</option>
          <option value="openai-vtt">VTT</option>
          <option value="openai-str">STR</option>
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
