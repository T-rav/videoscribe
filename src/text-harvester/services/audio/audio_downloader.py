import json
import os
import re
import subprocess
import logging
from typing import Optional

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
