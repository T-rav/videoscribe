import os
from typing import List, Iterator
from pydub import AudioSegment

class AudioService:
    
    @staticmethod
    def split_audio(file_path: str, segment_length_ms: int = 600000) -> Iterator[str]:
        song = AudioSegment.from_file(file_path)
        parts = len(song) // segment_length_ms + 1
        base, ext = os.path.splitext(file_path)
        audio_format = ext.replace('.', '')

        for i in range(parts):
            start = i * segment_length_ms
            part = song[start:start + segment_length_ms]
            part_file_path = f"{base}_part{i}{ext}"
            if audio_format == 'm4a':
                part.export(part_file_path, format='ipod')
            else:
                part.export(part_file_path, format=audio_format)
            yield part_file_path

    @staticmethod
    def transcribe_audio_segment(service, audio_file_path: str, prompt: str) -> str:
        return service.transcribe(audio_file_path, prompt)

    @staticmethod
    def transcribe_audio(file_path: str, service, prompt: str) -> str:
        if os.path.getsize(file_path) > 26214400:
            transcriptions: List[str] = []
            system_prompt = prompt
            for segment_path in AudioService.split_audio(file_path):
                transcription = AudioService.transcribe_audio_segment(service, segment_path, system_prompt)
                system_prompt = f"{transcription} {prompt}"
                transcriptions.append(transcription)
                os.remove(segment_path)
            return ' '.join(transcriptions)
        else:
            return AudioService.transcribe_audio_segment(service, file_path, prompt)
