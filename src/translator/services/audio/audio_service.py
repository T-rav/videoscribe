import os
import logging
from typing import List
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor, as_completed
from services.transcription import TranscriptionService
from services.audio.srt_adjuster import SrtAdjuster
from services.audio.vtt_adjuster import VttAdjuster
from ...enums.transcription_service_type import TranscriptionServiceType

class AudioService:

    @staticmethod
    def split_audio(file_path: str, segment_length_ms: int = 600000) -> List[str]:
        song = AudioSegment.from_file(file_path)
        parts = (len(song) + segment_length_ms - 1) // segment_length_ms  # Calculate number of parts
        base, ext = os.path.splitext(file_path)
        audio_format = ext.replace('.', '')

        def export_segment(i: int):
            start = i * segment_length_ms
            part = song[start:start + segment_length_ms]
            part_file_path = f"{base}_part{i}{ext}"
            part.export(part_file_path, format=audio_format if audio_format != 'm4a' else 'ipod')
            return part_file_path

        with ThreadPoolExecutor(max_workers=6) as executor:
            segments = list(executor.map(export_segment, range(parts)))

        return segments

    @staticmethod
    def transcribe_audio(file_path: str, service: TranscriptionService, prompt: str) -> str:
        if os.path.getsize(file_path) > 26214400:  # If file size exceeds 25MB
            segments = AudioService.split_audio(file_path)

            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(service.transcribe, segment, prompt): i for i, segment in enumerate(segments)}
                transcriptions = [None] * len(segments)

                for future in as_completed(futures):
                    index = futures[future]
                    try:
                        transcriptions[index] = future.result()
                    except Exception as e:
                        logging.error(f"Error transcribing segment {index}: {e}")
                    finally:
                        os.remove(segments[index])  # Clean up the segment file

            return ' '.join(filter(None, transcriptions))
        else:
            return service.transcribe(file_path, prompt)

    @staticmethod
    def adjust_transcript_if_needed(transcription_file_path: str, service_type: TranscriptionServiceType) -> str:
        if service_type == TranscriptionServiceType.OPENAI_SRT:
            adjusted_srt_file_path = transcription_file_path.replace(".srt", "_adjusted.srt")
            srt_adjuster = SrtAdjuster(transcription_file_path, adjusted_srt_file_path)
            srt_adjuster.adjust_timings()
            os.replace(adjusted_srt_file_path, transcription_file_path)  # Replace original with adjusted
            logging.debug(f"Replaced original SRT file with adjusted SRT file: {transcription_file_path}")

        elif service_type == TranscriptionServiceType.OPENAI_VTT:
            adjusted_vtt_file_path = transcription_file_path.replace(".vtt", "_adjusted.vtt")
            vtt_adjuster = VttAdjuster(transcription_file_path, adjusted_vtt_file_path)
            vtt_adjuster.adjust_timings()
            os.replace(adjusted_vtt_file_path, transcription_file_path)  # Replace original with adjusted
            logging.debug(f"Replaced original VTT file with adjusted VTT file: {transcription_file_path}")

        # Return the path to the adjusted transcript
        with open(transcription_file_path, 'r', encoding='utf-8') as file:
            return file.read(), transcription_file_path

