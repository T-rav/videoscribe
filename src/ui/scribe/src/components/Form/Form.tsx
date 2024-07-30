import React from 'react';
import './Form.css';

const Form: React.FC = () => {
  return (
    <div className="form-container">
      <h2>Transcribe YouTube Videos</h2>
      <form>
        <label htmlFor="youtube-link">YouTube Link</label>
        <input type="text" id="youtube-link" placeholder="Paste YouTube link here" />

        <label htmlFor="transcription-type">Transcription Type</label>
        <select id="transcription-type">
          <option value="normal">Normal</option>
          <option value="vtt">VTT</option>
          <option value="str">STR</option>
        </select>

        <label htmlFor="transcription-prompt">Transcription Prompt</label>
        <input type="text" id="transcription-prompt" placeholder="Enter a prompt for the transcription" />
      </form>
    </div>
  );
};

export default Form;
