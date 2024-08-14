#!/bin/bash

# Script Name: kodex.sh
# Purpose: This script recursively searches a given directory for files with specified extensions,
# verifies that they are plain text files, and concatenates their content into a single output file.
# This output file can then be used as input for GPT or other text processing tools.
#
# Usage: ./kodex.sh <start_directory> <output_file> <extensions>
# 
# <start_directory>: The root directory where the script will begin its search.
# <output_file>: The file where the concatenated content of the matching files will be saved.
# <extensions>: A comma-separated list of file extensions to include (e.g., "py,css,ts,html").
#
# Example: 
# ./kodex.sh ./src/ui/scribe output.txt "py,css,ts,html"
# This example searches the ./src/ui/scribe directory for files with .py, .css, .ts, and .html extensions,
# checks if they are plain text files, and concatenates their content into output.txt.
#
# This script is particularly useful for gathering code and related text files into a single file for input into GPT models.

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
if [ -z "$OUTPUT_FILE$START_DIR" ]; then
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

# Define directories to ignore
IGNORE_DIRS="node_modules dist build"

# Recursively find all files, check if they match the extensions and are plain text files
find "$START_DIR" -type d \( $(printf -- '-name %s -o ' $IGNORE_DIRS) -false \) -prune -o -type f | while read -r FILE; do
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

# Usage: ./kodex.sh text-harvester foo.txt "py,css,ts,html"     