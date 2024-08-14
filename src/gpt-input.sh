#!/bin/bash

# Set the starting directory, output file, and extensions list
START_DIR="$1"
OUTPUT_FILE="$2"
EXTENSIONS="$3"

# Check if the start directory is provided
if [ -z "$START_DIR" ]; then
  echo "Usage: $0 <start_directory> <output_file> <extensions>"
  exit 1
fi

# Check if the output file is provided
if [ -z "$OUTPUT_FILE" ]; then
  echo "Usage: $0 <start_directory> <output_file> <extensions>"
  exit 1
fi

# Check if the extensions list is provided
if [ -z "$EXTENSIONS" ]; then
  echo "Usage: $0 <start_directory> <output_file> <extensions>"
  exit 1
fi

# Convert the extensions list to a regex pattern
EXTENSIONS_PATTERN=$(echo "$EXTENSIONS" | sed 's/,/|/g')

# Create or empty the output file
> "$OUTPUT_FILE"

# Recursively find all files, check if they match the extensions and are plain text files
find "$START_DIR" -type f | while read -r FILE; do
  # Check if the file has the desired extension
  if echo "$FILE" | grep -E "\.($EXTENSIONS_PATTERN)$" > /dev/null; then
    # Use file command to check if the file is plain text
    if file "$FILE" | grep -E 'ASCII text|UTF-8 Unicode text|ISO-8859 text|Non-ISO extended-ASCII text' > /dev/null; then
      RELATIVE_PATH="${FILE#$START_DIR/}"
      echo "----- FILE: $RELATIVE_PATH -----" >> "$OUTPUT_FILE"
      cat "$FILE" >> "$OUTPUT_FILE"
      echo -e "\n" >> "$OUTPUT_FILE"  # Add three newlines after each file
    else
      echo "Skipping non-text file: $FILE"
    fi
  else
    echo "Skipping file with unmatched extension: $FILE"
  fi
done

echo "All matching text files have been concatenated into $OUTPUT_FILE."

# Usage: ./gpt-input.sh text-harvester foo.txt "py,css,ts,html"     