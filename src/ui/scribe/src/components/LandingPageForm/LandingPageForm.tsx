import React, { useState } from 'react';
import './LandingPageForm.css';
import { useNotificationContext } from '../NotificationContext';

const LandingPageForm: React.FC = () => {
  const [videoLink, setVideoLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [transformOption, setTransformOption] = useState('summarize');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    { title: string; duration: string; transcript: string }[]
  >([]);
  const { addNotification } = useNotificationContext();

  const maxFileSizeInMB = 2500; // 2.5 GB

  const isFileSizeValid = (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024; // Convert MB to Bytes
    return file.size <= maxSizeInBytes;
  };
  
  const handleVideoLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoLink(e.target.value);
    setError(null); // Clear any previous errors
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (!isFileSizeValid(selectedFile, maxFileSizeInMB)) {
        setError(`File size exceeds ${maxFileSizeInMB} MB. Please upload a smaller file.`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null); // Clear any previous errors
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];

      if (!isFileSizeValid(selectedFile, maxFileSizeInMB)) {
        setError(`File size exceeds ${maxFileSizeInMB} MB. Please upload a smaller file.`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null); // Clear any previous errors
      setVideoLink('');
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let data: FormData | { url: string; transform: string; transcriptionType: string };

    if (file) {
      data = new FormData();
      data.append('file', file); // Add the file to the FormData
      data.append('transform', transformOption); // Add the transform option
      data.append('transcriptionType', 'openai'); // Ensure transcription type is sent

      try {
        const response = await fetch('http://localhost:3001/transcribe_file', {
          method: 'POST',
          body: data, // Send FormData as the body
        });

        if (response.ok) {
          const result = await response.json();

          const structuredResult = {
            title: result.title,
            duration: result.duration,
            transcript: result.transcript,
          };

          addNotification({
            title: structuredResult.title,
            datetime: new Date().toLocaleString(),
            length: structuredResult.duration,
            progress: 'Completed',
            transcript: structuredResult.transcript,
          });

          setResults((prevResults) => [structuredResult, ...prevResults]);
        } else {
          const error = await response.json();
          setError(error.error || response.statusText);
        }
      } catch (error) {
        setError('An error occurred while processing the request.');
      } finally {
        setLoading(false);
      }

    } else if (videoLink) {
      if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
        data = {
          url: videoLink,
          transform: transformOption,
          transcriptionType: 'openai', // Ensure transcription type is sent
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
          transcriptionType: 'openai', // Ensure transcription type is sent
        };
      } else {
        setError('Unsupported URL. Please provide a valid YouTube or Google Drive link.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/transcribe_link', {
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

          addNotification({
            title: structuredResult.title,
            datetime: new Date().toLocaleString(),
            length: structuredResult.duration,
            progress: 'Completed',
            transcript: structuredResult.transcript,
          });

          setResults((prevResults) => [structuredResult, ...prevResults]);
        } else {
          const error = await response.json();
          setError(error.error || response.statusText);
        }
      } catch (error) {
        setError('An error occurred while processing the request.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please provide either a video link or upload a file.');
      setLoading(false);
    }
  };

  const copyToClipboard = (transcript: string) => {
    const formattedText = `Transcript:\n\n${transcript}`;
    navigator.clipboard.writeText(formattedText);
  };

  const closeTranscript = (index: number) => {
    setResults((prevResults) => prevResults.filter((_, i) => i !== index));
  };

  return (
    <div className="form-container">
      <h2>Transcribe and Enhance Your Videos</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div
          className="file-upload-container"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            id="file-upload"
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="file-upload-label">
            <div className="file-dropzone">
              {file ? (
                <span>{file.name}</span>
              ) : (
                <>
                  <span>Upload file</span>
                  <p>Click to browse or drag & drop a file here</p>
                </>
              )}
            </div>
          </label>
        </div>

        <label htmlFor="video-link">Paste a video link from YouTube or Google Drive</label>
        <input
          type="text"
          id="video-link"
          value={videoLink}
          onChange={handleVideoLinkChange}
          placeholder="Paste YouTube or Google Drive link here"
        />

        <label htmlFor="transform-option">Enhancement</label>
        <select
          id="transform-option"
          value={transformOption}
          onChange={(e) => setTransformOption(e.target.value)}
        >
          <option value="none">None</option>
          <option value="summarize">Summarize</option>
          <option value="formatting">Format for Readability</option>
          <option value="fillerremoval">Filler Word Removal</option>
          <option value="paragraphs">Paragraphs</option>
          <option value="keywords">Keyword Extraction</option>
          {/* <option value="translation">Translation</option> */}
        </select>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Transcribe'}
        </button>
      </form>

      {results.map((result, index) => (
        <div key={index} className="transcription-result">
          <button className="close-button" onClick={() => closeTranscript(index)}>X</button>
          <h3>#{results.length - index}</h3>
          <h4>Title: {result.title}</h4>
          <p>Duration: {result.duration} seconds</p>
          <h4>Transcript:</h4>
          <pre>{result.transcript}</pre>
          <button className="copy-button" onClick={() => copyToClipboard(result.transcript)}>Copy</button>
        </div>
      ))}


    </div>
  );
};

export default LandingPageForm;
