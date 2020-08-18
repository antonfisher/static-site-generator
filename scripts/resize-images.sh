#!/usr/bin/env bash

MAX_WIDTH=800

echo "Looking for images..."

find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" |
  while read name; do
    width=$(identify -format "%w" "$name")
    if [ "$width" -gt "$MAX_WIDTH" ]; then
      convert ${name} -verbose -resize $MAX_WIDTH ${name}
    fi
  done

echo "Done."
