import os
import subprocess
import logging

class FileHandler:
    
    @staticmethod
    def handle_local_file(file_path: str, output_dir: str) -> str:
        file_name = os.path.basename(file_path)
        base_name, ext = os.path.splitext(file_name)
        audio_file_path = os.path.join(output_dir, "audio", base_name + "_audio.m4a")

        # Check for video formats that need conversion to audio
        if ext.lower() in [".mov", ".mp4", ".avi", ".mkv", ".webm"]:
            logging.debug(f"Converting video file {file_name} to audio...")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            subprocess.run(['ffmpeg', '-i', file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'm4a', audio_file_path], check=True)
        elif ext.lower() not in [".m4a", ".mp3"]:
            logging.debug(f"Converting unsupported audio file {file_name} to m4a...")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            subprocess.run(['ffmpeg', '-i', file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'm4a', audio_file_path], check=True)
        else:
            logging.debug(f"No conversion needed for file {file_name}, copying to output directory...")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            subprocess.run(['cp', file_path, audio_file_path])

        return audio_file_path
