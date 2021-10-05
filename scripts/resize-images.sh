#!/usr/bin/env bash

#
# Resize (PNG, JPG) and compress (PNG) images recursively in the run folder
# if greater than MAX_WIDTH (first parameter).
#
# Usage:
#   resize-and-compress-images.sh 730
#
# Requirements:
#   apt install imagemagick pngquant
#

#MAX_WIDTH=790
MAX_WIDTH="${1}"

if ! [[ "$MAX_WIDTH" =~ ^[0-9]+$ ]]; then
  echo "Usage:" >&2
  echo "    resize-images.sh MAX_WIDTH"
  echo "" >&2
  echo "    MAX_WIDTH is a number greater than 0 (790 for antonfisher.com)" >&2
  echo "" >&2
  echo "Filename rules:" >&2
  echo "   *-ir.* ignore resizing" >&2
  echo "   *-ic.* ignore compression" >&2
  exit 1
elif [ "$MAX_WIDTH" -le "0" ]; then
  echo "ERROR: MAX_WIDTH cannot be less than 1" >&2
  exit 1
fi

echo "Looking for images in: $(pwd) ..."

find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" |
  while read name; do
    width=$(identify -format "%w" "$name")
    if [ "$width" -gt "$MAX_WIDTH" ]; then
      size_before=$(ls -lha ${name} | awk '{print $5}')
      if [[ "$name" =~ -ir\.*.+$ ]]; then
        echo -e "Resize: IGNORED"
      else
        convert ${name} -verbose -resize $MAX_WIDTH ${name}
      fi
      if [[ "$name" =~ -ic\.*.+$ ]]; then
        echo -e "Compress: IGNORED"
      elif [[ "$name" =~ \.png$ ]]; then
        pngquant --force --speed 1 --skip-if-larger --ext .png ${name}
      fi
      size_after=$(ls -lha ${name} | awk '{print $5}')
      echo -e "Size: ${size_before}\t-> ${size_after}"
    fi
  done

echo "Done."
