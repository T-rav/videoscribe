import json
import subprocess
import os
import re
import logging
from typing import Optional
from urllib.parse import urlparse, parse_qs

class AudioDownloader:

    @staticmethod
    def get_video_info(url: str) -> dict:
        command = ['yt-dlp', '--dump-json', url]
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            return json.loads(result.stdout)
        except Exception as e:
            logging.error(f"Error occurred while trying to get video info: {str(e)}")
            return {"title": "Unknown Title", "duration": 0, "url": url}

    @staticmethod
    def download_audio(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
        logging.debug(f"Downloading audio from {url} to {path}")

        os.makedirs(path, exist_ok=True)

        command = [
            'yt-dlp', '-x', '--audio-format', 'm4a',
            '--output', os.path.join(path, '%(title)s.%(ext)s'),
            '--format', 'bestaudio', '-N', '4', url
        ]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            file_path_match = re.search(r'Destination:\s+(.*\.m4a)', result.stdout)

            if file_path_match:
                file_path = file_path_match.group(1)
                if max_length_minutes:
                    trimmed_file_path = file_path.replace('.m4a', '_trimmed.m4a')
                    subprocess.run(['ffmpeg', '-i', file_path, '-ss', '00:00:00', '-t', f'{max_length_minutes * 60}', trimmed_file_path], check=True)
                    os.remove(file_path)
                    return trimmed_file_path
                return file_path
            else:
                logging.error("File path not found in yt-dlp output")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error: {e.stderr}")
        return None

    @staticmethod
    def download_vimeo_video(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
        logging.debug(f"Processing Vimeo URL: {url}")
        
        vimeo_dir = os.path.join(path, 'vimeo')
        os.makedirs(vimeo_dir, exist_ok=True)

        command = [
            'yt-dlp',
            '--output', os.path.join(vimeo_dir, '%(title)s.%(ext)s'),
            '--format', 'bestvideo+bestaudio/best',  # Download best video and audio format available
            url
        ]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            output = result.stdout
            
            downloaded_files = os.listdir(vimeo_dir)
            if downloaded_files:
                video_file_path = os.path.join(vimeo_dir, downloaded_files[0])
                
                # Convert the video file to audio
                audio_file_name = os.path.splitext(os.path.basename(video_file_path))[0] + '_audio.m4a'
                audio_dir = os.path.join(path, 'audio')
                os.makedirs(audio_dir, exist_ok=True)
                audio_file_path = os.path.join(audio_dir, audio_file_name)
                
                subprocess.run(['ffmpeg', '-i', video_file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'ipod', audio_file_path], check=True)
                os.remove(video_file_path)  # Delete the original video file

                if max_length_minutes:
                    trimmed_file_path = audio_file_path.replace('.m4a', '_trimmed.m4a')
                    subprocess.run(['ffmpeg', '-i', audio_file_path, '-ss', '00:00:00', '-t', f'{max_length_minutes * 60}', trimmed_file_path], check=True)
                    os.remove(audio_file_path)
                    return trimmed_file_path

                return audio_file_path
            else:
                logging.error("No files were downloaded.")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error downloading video from Vimeo: {e.stderr}")
        
        return None

    @staticmethod
    def download_google_drive_video(url: str, path: str, max_length_minutes: Optional[int] = None) -> Optional[str]:
        logging.debug(f"Processing Google Drive URL: {url}")
        
        parsed_url = urlparse(url)
        file_id = None

        if 'drive.google.com' in parsed_url.netloc:
            if '/file/d/' in parsed_url.path:
                file_id = parsed_url.path.split('/')[3]
            elif 'id=' in parsed_url.query:
                query_params = parse_qs(parsed_url.query)
                file_id = query_params.get('id', [None])[0]
            else:
                logging.error("Invalid Google Drive URL")
                return None
        else:
            logging.error("Invalid Google Drive URL")
            return None

        if not file_id:
            logging.error("File ID could not be extracted.")
            return None

        direct_link = f"https://drive.google.com/uc?export=download&id={file_id}"
        
        google_dir = os.path.join(path, 'google')
        os.makedirs(google_dir, exist_ok=True)

        command = [
            'yt-dlp',
            '--output', os.path.join(google_dir, '%(title)s.%(ext)s'),
            '--format', 'bestvideo+bestaudio/best',
            direct_link
        ]

        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            downloaded_files = os.listdir(google_dir)
            if downloaded_files:
                video_file_path = os.path.join(google_dir, downloaded_files[0])
                
                # Convert the video file to audio
                audio_file_name = os.path.splitext(os.path.basename(video_file_path))[0] + '_audio.m4a'
                audio_dir = os.path.join(path, 'audio')
                os.makedirs(audio_dir, exist_ok=True)
                audio_file_path = os.path.join(audio_dir, audio_file_name)
                
                subprocess.run(['ffmpeg', '-i', video_file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'ipod', audio_file_path], check=True)
                os.remove(video_file_path)  # Delete the original video file

                if max_length_minutes:
                    trimmed_file_path = audio_file_path.replace('.m4a', '_trimmed.m4a')
                    subprocess.run(['ffmpeg', '-i', audio_file_path, '-ss', '00:00:00', '-t', f'{max_length_minutes * 60}', trimmed_file_path], check=True)
                    os.remove(audio_file_path)
                    return trimmed_file_path

                return audio_file_path
            else:
                logging.error("No files were downloaded.")
        except subprocess.CalledProcessError as e:
            logging.error(f"Error downloading video from Google Drive: {e.stderr}")
        
        return None
