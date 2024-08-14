import glob
import json
import os
import re
import subprocess
import logging
from typing import Optional
from urllib.parse import urlparse, parse_qs

class AudioDownloader:

    @staticmethod
    def get_video_info(url: str) -> dict:
        command = [
            'yt-dlp',
            '--dump-json',
            url
        ]
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        video_info = result.stdout
        return json.loads(video_info)

    @staticmethod
    def download_audio(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
        logging.debug(f"Downloading audio from {url} to {path}")
        current_directory = os.getcwd()
        logging.debug(f"Current Directory: {current_directory}")

        if not os.path.exists(path):
            os.makedirs(path)

        command = [
            'yt-dlp',
            '-x',  # Extract audio
            '--audio-format', 'm4a',  # Specify audio format
            '--output', os.path.join(path, '%(title)s.%(ext)s'),  # Naming convention
            '--format', 'bestaudio',
            '-N', '4',  # use 4 connections
            url  # YouTube URL
        ]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            output = result.stdout
            logging.debug(f"yt-dlp output: {output}")
            file_path_match = re.search(r'Destination:\s+(.*\.m4a)', output)
            
            if file_path_match:
                file_path = file_path_match.group(1).strip()
                logging.debug(f"File path found: {file_path}")
                if os.path.exists(file_path) and file_path.endswith(".m4a"):
                    logging.debug(f"File exists: {file_path}")
                    if max_length_minutes:
                        logging.debug(f"Trimming audio file: {file_path}")
                        max_length_seconds = max_length_minutes * 60
                        trimmed_file_path = file_path.replace('.m4a', '_trimmed.m4a')
                        subprocess.run(['ffmpeg', '-i', file_path, '-ss', '00:00:00', '-t', str(max_length_seconds), trimmed_file_path], check=True)
                        os.remove(file_path)
                        return trimmed_file_path
                    return file_path
                else:
                    logging.error(f"File does not exist or is not a .m4a file: {file_path}")
            else:
                logging.error("File path not found in yt-dlp output")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error: {e.stderr}")
        
        return None

    @staticmethod
    def download_google_drive_video(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
        logging.debug(f"Processing Google Drive URL: {url}")
        
        # Extract file ID from Google Drive URL
        parsed_url = urlparse(url)
        if 'drive.google.com' in parsed_url.netloc:
            if '/file/d/' in parsed_url.path:
                # Extract file ID from /file/d/FILE_ID/view format
                file_id = parsed_url.path.split('/')[3]
            elif 'id=' in parsed_url.query:
                # Extract file ID from id=FILE_ID format
                query_params = parsed_url.query
                file_id = query_params.split('=')[1]
            else:
                logging.error("Invalid Google Drive URL")
                return None
        else:
            logging.error("Invalid Google Drive URL")
            return None

        # Convert to direct download link
        direct_link = f"https://drive.google.com/uc?export=download&id={file_id}"

        logging.debug(f"Converted Google Drive link to direct download: {direct_link}")
        
        google_dir = os.path.join(path, 'google')
        if not os.path.exists(google_dir):
            os.makedirs(google_dir)

        command = [
            'yt-dlp',
            '--output', os.path.join(google_dir, '%(title)s.%(ext)s'),  # Naming convention
            '--format', 'bestvideo+bestaudio/best',  # Download best video and audio format available
            direct_link  # Google Drive direct download URL
        ]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            output = result.stdout
            logging.debug(f"yt-dlp output: {output}")
            
            # Find the downloaded video file
            downloaded_files = os.listdir(google_dir)
            if downloaded_files:
                video_file_path = os.path.join(google_dir, downloaded_files[0])
                logging.debug(f"Downloaded video file path: {video_file_path}")
                
                # Convert the video file to audio
                audio_file_path = os.path.splitext(video_file_path)[0] + '.m4a'
                subprocess.run(['ffmpeg', '-i', video_file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'mp4', audio_file_path], check=True)
                logging.debug(f"Converted audio file saved to {audio_file_path}")
                
                if max_length_minutes:
                    logging.debug(f"Trimming audio file: {audio_file_path}")
                    max_length_seconds = max_length_minutes * 60
                    trimmed_file_path = audio_file_path.replace('.m4a', '_trimmed.m4a')
                    subprocess.run(['ffmpeg', '-i', audio_file_path, '-ss', '00:00:00', '-t', str(max_length_seconds), trimmed_file_path], check=True)
                    os.remove(audio_file_path)
                    return trimmed_file_path

                return audio_file_path
            else:
                logging.error("No files were downloaded.")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error downloading video from Google Drive: {e.stderr}")
        
        return None