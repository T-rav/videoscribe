import os
import logging
from pydub import AudioSegment

class FileHandler:
    
    @staticmethod
    def handle_local_file(file_path: str, output_dir: str) -> str:
        file_name = os.path.basename(file_path)
        base_name, ext = os.path.splitext(file_name)
        audio_file_path = os.path.join(output_dir, "audio", base_name + "_audio.m4a")

        # Check for video formats that need conversion to audio
        if ext.lower() in [".mov", ".mp4", ".avi", ".mkv", ".webm"]:
            logging.debug(f"Converting video file {file_name} to audio and saving to {audio_file_path}")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            audio = AudioSegment.from_file(file_path)
            audio.export(audio_file_path, format="ipod", bitrate="128k", parameters=["-ar", "16000", "-ac", "1"])
        elif ext.lower() not in [".m4a", ".mp3"]:
            logging.debug(f"Converting unsupported audio file {file_name} to m4a...")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            audio = AudioSegment.from_file(file_path)
            audio.export(audio_file_path, format="ipod", bitrate="128k", parameters=["-ar", "16000", "-ac", "1"])
        else:
            logging.debug(f"No conversion needed for file {file_name}, copying to output directory...")
            os.makedirs(os.path.dirname(audio_file_path), exist_ok=True)
            with open(file_path, "rb") as src_file:
                with open(audio_file_path, "wb") as dst_file:
                    dst_file.write(src_file.read())

        return audio_file_path
