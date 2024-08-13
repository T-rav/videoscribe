import os
import subprocess
import logging

class FileHandler:
    
    @staticmethod
    def handle_local_file(file_path: str, output_dir: str) -> str:
        file_name = os.path.basename(file_path)
        audio_file_path = os.path.join(output_dir, "audio", file_name)

        if not (file_name.endswith(".m4a") or file_name.endswith(".mp3")):
            logging.debug("Converting local file to audio...")
            file_name = file_name.replace(" ", "-")
            audio_file_path = os.path.join(output_dir, "audio", os.path.splitext(file_name)[0] + "_audio.m4a")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            subprocess.run(['ffmpeg', '-i', file_path, '-vn', '-ar', '16000', '-ac', '1', '-ab', '128k', '-f', 'ipod', audio_file_path], check=True)

        return audio_file_path
