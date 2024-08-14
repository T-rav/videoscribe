import pytest
from unittest.mock import mock_open, patch, MagicMock
from services.audio.audio_service import AudioService

def test_transcribe_audio(mocker):
    # Mock the transcribe_audio_segment method within AudioService
    mocker.patch('services.audio.audio_service.AudioService.transcribe_audio_segment', return_value="Transcribed text")

    # Mock the file size and file access
    mocker.patch('os.path.getsize', return_value=1024)  # Mock file size less than 25MB
    mocker.patch('builtins.open', mock_open(read_data="mocked file content"))  # Mock file access

    # Perform the test
    result = AudioService.transcribe_audio('path/to/audio.m4a', MagicMock(), 'test prompt')

    # Verify that the result is as expected
    assert result == "Transcribed text"

def test_split_audio(mocker):
    mock_pydub = mocker.patch('services.audio.audio_service.AudioSegment.from_file')
    mock_audio_segment = MagicMock()
    mock_audio_segment.__len__.return_value = 1200000  # 20 minutes of audio (1,200,000 ms)
    mock_pydub.return_value = mock_audio_segment

    result = AudioService.split_audio('path/to/audio.m4a', segment_length_ms=600000)

    assert len(result) == 2  # Adjust this expectation based on your real logic or mock duration
    assert "part0.m4a" in result[0]
    assert "part1.m4a" in result[1]
