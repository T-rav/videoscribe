import os
import logging
from typing import List, Optional
from pydub import AudioSegment
from services.transcription import TranscriptionServiceType, TranscriptionService
from services.audio.srt_adjuster import SrtAdjuster
from services.audio.vtt_adjuster import VttAdjuster

class AudioService:
    
    @staticmethod
    def split_audio(file_path: str, segment_length_ms: int = 600000) -> List[str]:
        song = AudioSegment.from_file(file_path)
        parts = len(song) // segment_length_ms
        if len(song) % segment_length_ms != 0:
            parts += 1
        
        base, ext = os.path.splitext(file_path)
        audio_format = ext.replace('.', '')

        segments = []
        for i in range(parts):
            start = i * segment_length_ms
            part = song[start:start + segment_length_ms]
            part_file_path = f"{base}_part{i}{ext}"
            if audio_format == 'm4a':
                part.export(part_file_path, format='ipod')
            else:
                part.export(part_file_path, format=audio_format)
            segments.append(part_file_path)
        
        return segments

    @staticmethod
    def transcribe_audio_segment(service: TranscriptionServiceType, audio_file_path: str, prompt: str) -> str:
        try:
            # Making the transcription API call
            with open(audio_file_path, 'rb') as audio_file:
                logging.debug(f"Processing part {audio_file_path}")
                transcription = service.client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file, 
                    prompt=prompt,
                    response_format=service.file_name_extension().lstrip('.')
                )
                # Handle the response as plain text
                transcription_text = transcription
        except Exception as e:
            logging.error(f"Error transcribing audio file: {e}")
            transcription_text = ""
        
        return transcription_text

    @staticmethod
    def transcribe_audio(file_path: str, service: TranscriptionService, prompt: str) -> str:
        if os.path.getsize(file_path) > 26214400:  # If file size exceeds 25MB
            transcriptions: List[str] = []
            system_prompt = prompt
            for segment_path in AudioService.split_audio(file_path):
                transcription = service.transcribe(segment_path, system_prompt)
                system_prompt = f"{transcription} {prompt}"
                transcriptions.append(transcription)
                os.remove(segment_path)
            return ' '.join(transcriptions)
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