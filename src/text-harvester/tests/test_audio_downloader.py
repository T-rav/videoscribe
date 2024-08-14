import pytest
from unittest.mock import patch, MagicMock, call
from services.audio.audio_downloader import AudioDownloader

def test_get_video_info(mocker):
    mock_subprocess = mocker.patch('subprocess.run')
    mock_subprocess.return_value.stdout = '{"title": "Test Video", "duration": 120}'

    result = AudioDownloader.get_video_info('https://www.youtube.com/watch?v=abc123')
    
    assert result['title'] == "Test Video"
    assert result['duration'] == 120

def test_download_audio(mocker):
    mock_subprocess = mocker.patch('subprocess.run')
    mock_subprocess.return_value.stdout = 'Destination: /fake/path/to/audio.m4a'
    mocker.patch('os.makedirs')  # Mock os.makedirs to avoid filesystem access
    mocker.patch('os.path.exists', return_value=True)  # Mock os.path.exists to always return True

    result = AudioDownloader.download_audio('https://www.youtube.com/watch?v=abc123', '/fake/path')
    
    assert result == '/fake/path/to/audio.m4a'
    mock_subprocess.assert_called_once_with(
        [
            'yt-dlp',
            '-x',  # Extract audio
            '--audio-format', 'm4a',  # Specify audio format
            '--output', '/fake/path/%(title)s.%(ext)s',  # Naming convention
            '--format', 'bestaudio',
            '-N', '4',  # use 4 connections
            'https://www.youtube.com/watch?v=abc123'
        ],
        check=True, capture_output=True, text=True
    )

def test_download_google_drive_video(mocker):
    mock_subprocess = mocker.patch('subprocess.run')
    
    # Mock the first subprocess call for yt-dlp
    mock_subprocess.side_effect = [
        mocker.Mock(stdout='Destination: /fake/path/google/video.mp4'),
        mocker.Mock()  # Mock for the second call (ffmpeg)
    ]
    
    # Mock all relevant file system operations
    mocker.patch('os.makedirs')  # Mock directory creation
    mocker.patch('os.path.exists', return_value=True)  # Mock path existence checks
    mocker.patch('os.listdir', return_value=['video.mp4'])  # Mock file listing
    mocker.patch('os.remove')  # Mock os.remove to prevent actual file deletion
    
    result = AudioDownloader.download_google_drive_video('https://drive.google.com/file/d/abc123/view', '/fake/path')

    # Verify the expected output
    assert result == "/fake/path/audio/video_audio.m4a"
    
    # Verify both subprocess calls
    mock_subprocess.assert_has_calls([
        mocker.call(
            [
                'yt-dlp',
                '--output', '/fake/path/google/%(title)s.%(ext)s',  # Naming convention
                '--format', 'bestvideo+bestaudio/best',  # Download best video and audio format available
                'https://drive.google.com/uc?export=download&id=abc123'
            ],
            check=True, capture_output=True, text=True
        ),
        mocker.call(
            [
                'ffmpeg',
                '-i', '/fake/path/google/video.mp4',
                '-vn', '-ar', '16000',
                '-ac', '1', '-ab', '128k',
                '-f', 'mp4', '/fake/path/audio/video_audio.m4a'
            ],
            check=True
        )
    ])
