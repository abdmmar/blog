#!/bin/bash

# Script to recursively find JPG/JPEG images, resize them to 50%
# of their original dimensions, and re-compress them, keeping the original extension.
# The output file will be saved in the same directory as the original image,
# with a "_resized" suffix.

# --- Configuration ---
# Set to 1 to enable verbose output from ffmpeg, 0 to disable
FFMPEG_VERBOSE=0
# Set to 1 to overwrite existing "_resized" output files, 0 to skip if exists
OVERWRITE_EXISTING=0
# JPEG quality for re-compression (2-31, lower is higher quality)
JPEG_QUALITY=4

# --- Functions ---

# Function to display help message
show_help() {
  echo "Usage: $0 [TARGET_DIRECTORY]"
  echo
  echo "Recursively finds JPG/JPEG images in TARGET_DIRECTORY (or current directory if not specified),"
  echo "resizes them to 50% of original dimensions, and re-compresses them."
  echo "Output files are saved in the same directory with a '_resized' suffix and original extension."
  echo
  echo "Options:"
  echo "  -h, --help    Show this help message and exit."
  echo
  echo "Configurable at the top of the script:"
  echo "  FFMPEG_VERBOSE:   Set to 1 for verbose ffmpeg output (default: $FFMPEG_VERBOSE)."
  echo "  OVERWRITE_EXISTING: Set to 1 to overwrite existing output files (default: $OVERWRITE_EXISTING)."
  echo "  JPEG_QUALITY:     Set JPEG quality for re-compression (2-31, default: $JPEG_QUALITY)."
  echo
  echo "Requirements: ffmpeg must be installed and in your PATH."
}

# Function to process a single image file
process_image() {
  local filepath="$1"
  local dirpath
  local filename
  local filename_no_ext
  local extension
  local output_filepath

  # Get the directory of the current file
  dirpath=$(dirname "$filepath")
  # Get the filename (e.g., image.jpg)
  filename=$(basename "$filepath")
  # Get the filename without the extension (e.g., image)
  filename_no_ext="${filename%.*}"
  # Get the extension (e.g., jpg)
  extension="${filename##*.}"

  # Define the output filepath (e.g., /path/to/image_resized.jpg)
  output_filepath="${dirpath}/${filename_no_ext}_resized.${extension}"

  echo "--------------------------------------------------"
  echo "Processing: $filepath"

  # Check if output file already exists and if we should skip
  if [ "$OVERWRITE_EXISTING" -eq 0 ] && [ -f "$output_filepath" ]; then
    echo "Skipping: Output file $output_filepath already exists."
    return
  fi

  # Construct the ffmpeg command
  local ffmpeg_cmd
  ffmpeg_cmd=(ffmpeg)

  # Add -y for overwrite if OVERWRITE_EXISTING is 1, otherwise -n to not overwrite (safer default)
  if [ "$OVERWRITE_EXISTING" -eq 1 ]; then
    ffmpeg_cmd+=(-y) # Overwrite output files without asking
  else
    ffmpeg_cmd+=(-n) # Do not overwrite output files if they exist
  fi
  
  ffmpeg_cmd+=(
    -i "$filepath"
    -vf "scale=iw/2:ih/2" # Scale to 50% width and height
    -q:v "$JPEG_QUALITY"    # Set JPEG quality for re-compression
    "$output_filepath"
  )

  # Add logging level for ffmpeg
  if [ "$FFMPEG_VERBOSE" -eq 1 ]; then
    ffmpeg_cmd+=(-loglevel info)
  else
    ffmpeg_cmd+=(-loglevel error) 
  fi
  
  # Execute the ffmpeg command
  echo "Resizing and re-compressing to: $output_filepath"
  if "${ffmpeg_cmd[@]}"; then
    echo "Successfully processed: $filepath"
  else
    echo "ERROR: Failed to process: $filepath. FFmpeg exit code: $?"
  fi
}

# --- Main Script Logic ---

# Parse command line arguments (for -h or --help)
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  show_help
  exit 0
fi

# Target directory - use first argument or "." (current directory) if not provided
TARGET_DIR="${1:-.}"

# Check if the target directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory '$TARGET_DIR' not found."
  show_help
  exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg command could not be found. Please install FFmpeg."
  exit 1
fi

echo "Starting image resizing and re-compression process..."
echo "Target directory: $(realpath "$TARGET_DIR")"
echo "Output: 50% original size, re-compressed JPEG (quality: $JPEG_QUALITY)"
echo "Output filename: original_filename_resized.original_extension"
echo "Overwrite existing output files: $(if [ "$OVERWRITE_EXISTING" -eq 1 ]; then echo "Yes"; else echo "No (skip if exists)"; fi)"
echo "FFmpeg verbose output: $(if [ "$FFMPEG_VERBOSE" -eq 1 ]; then echo "Enabled"; else echo "Disabled (errors only)"; fi)"
echo "=================================================="

# Find all .jpg and .jpeg files recursively in the target directory
# -print0 and read -d $'\0' are used to robustly handle filenames
# with spaces, newlines, or other special characters.
find "$TARGET_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0 | while IFS= read -r -d $'\0' image_file; do
  process_image "$image_file"
done

echo "=================================================="
echo "Image processing finished."
