import re
from datetime import timedelta

# Function to parse VTT time format
def parse_vtt_time(vtt_time):
    hours, minutes, seconds = map(float, vtt_time.replace(',', '.').split(':'))
    return timedelta(hours=int(hours), minutes=int(minutes), seconds=seconds)

# Function to format time back to VTT format
def format_vtt_time(td):
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    milliseconds = td.microseconds // 1000
    return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"

# Adjust timings in VTT file
def adjust_vtt_timings(vtt_file, output_file):
    with open(vtt_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    adjusted_lines = []
    #cumulative_offset = timedelta(0)
    last_end_time = timedelta(0)
    last_segment_end_time = timedelta(0)
    time_pattern = re.compile(r"(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})")

    for line in lines:
        match = time_pattern.match(line)
        if match:
            start_time, end_time = match.groups()
            start_time_td = parse_vtt_time(start_time)
            end_time_td = parse_vtt_time(end_time)

            print(f"Original: {start_time} --> {end_time}")
            print(f"Parsed: {start_time_td} --> {end_time_td}")
            print(f"Last End Time: {last_end_time}")
            # print(f"Cumulative Offset Before: {cumulative_offset}")

            if start_time_td < last_end_time:
                print("SEG SWITCH")
                last_segment_end_time = (last_segment_end_time + last_end_time)
                
            last_end_time = end_time_td
            start_time_td += last_segment_end_time
            end_time_td += last_segment_end_time

            print(f"Adjusted: {format_vtt_time(start_time_td)} --> {format_vtt_time(end_time_td)}\n")

            adjusted_line = f"{format_vtt_time(start_time_td)} --> {format_vtt_time(end_time_td)}\n"
            adjusted_lines.append(adjusted_line)
        else:
            adjusted_lines.append(line)

    with open(output_file, 'w', encoding='utf-8') as file:
        file.writelines(adjusted_lines)

# Example usage with your specified file paths
input_vtt_file = './incoming/transcript/GPT with Me - Ep 17： Bootstrapping a UI with Gen AI_transcript.vtt'
output_vtt_file = './incoming/transcript/adjusted_output.vtt'

adjust_vtt_timings(input_vtt_file, output_vtt_file)