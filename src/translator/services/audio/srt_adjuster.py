import re
from datetime import timedelta

class SrtAdjuster:
    
    def __init__(self, srt_file, output_file):
        self.srt_file = srt_file
        self.output_file = output_file

    # Function to parse SRT time format
    def parse_srt_time(self, srt_time):
        hours, minutes, seconds = map(float, srt_time.replace(',', '.').split(':'))
        return timedelta(hours=int(hours), minutes=int(minutes), seconds=seconds)

    # Function to format time back to SRT format
    def format_srt_time(self, td):
        total_seconds = int(td.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        milliseconds = td.microseconds // 1000
        return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"

    # Adjust timings in SRT file
    def adjust_timings(self):
        with open(self.srt_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        adjusted_lines = []
        last_end_time = timedelta(0)
        last_segment_end_time = timedelta(0)
        time_pattern = re.compile(r"(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})")
        
        subtitle_number = 1
        for line in lines:
            match = time_pattern.match(line)
            if line.strip().isdigit():
                adjusted_lines.append(f"{subtitle_number}\n")
                subtitle_number += 1
            elif match:
                start_time, end_time = match.groups()
                start_time_td = self.parse_srt_time(start_time)
                end_time_td = self.parse_srt_time(end_time)

                if start_time_td < last_end_time:
                    last_segment_end_time = last_segment_end_time + last_end_time
                
                last_end_time = end_time_td
                start_time_td += last_segment_end_time
                end_time_td += last_segment_end_time

                adjusted_line = f"{self.format_srt_time(start_time_td)} --> {self.format_srt_time(end_time_td)}\n"
                adjusted_lines.append(adjusted_line)
            else:
                adjusted_lines.append(line)

        with open(self.output_file, 'w', encoding='utf-8') as file:
            file.writelines(adjusted_lines)
