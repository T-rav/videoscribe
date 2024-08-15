import pytest
from unittest.mock import patch, MagicMock
import sys
import json
from app import main

def test_main_with_youtube_url(mocker):
    mock_get_video_info = mocker.patch('services.audio.audio_downloader.AudioDownloader.get_video_info', return_value={"title": "Test Video", "duration": 120})
    mock_download_audio = mocker.patch('services.audio.audio_downloader.AudioDownloader.download_audio', return_value="path/to/audio.m4a")
    mock_transcribe_audio = mocker.patch('services.audio.audio_service.AudioService.transcribe_audio', return_value="Transcribed text")
    mock_remove = mocker.patch('os.remove')
    
    expected_output = {
        "url": "https://www.youtube.com/watch?v=abc123",
        "title": "Test Video",
        "duration": 120,
        "service": "groq",
        "transcription_file_path": "path/to/audio_transcript.txt",
        "transcript": "Transcribed text"
    }
    
    test_args = ["app.py", "https://www.youtube.com/watch?v=abc123", "--path", "/fake/path"]
    with patch.object(sys, 'argv', test_args):
        with patch('builtins.print') as mock_print:
            main()

            mock_print.assert_called_once_with(json.dumps(expected_output))
    
    mock_get_video_info.assert_called_once()
    mock_download_audio.assert_called_once()
    mock_transcribe_audio.assert_called_once()
    mock_remove.assert_called_once_with("path/to/audio.m4a")
