#!/usr/bin/env bash

#MAX_WIDTH=730

MAX_WIDTH="${1}"
re='^[0-9]+$'
if ! [[ "$MAX_WIDTH" =~ $re ]] ; then
  echo "Usage:" >&2;
  echo "    resize-images.sh MAX_WIDTH" >&2;
  echo "" >&2;
  echo "    MAX_WIDTH is a number greater than 0" >&2;
  exit 1;
elif [ "$MAX_WIDTH" -le "0" ]; then
  echo "ERROR: MAX_WIDTH cannot be less than 1" >&2;
  exit 1;
fi

echo "Looking for images in: `pwd` ..."

find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" |
  while read name; do
    width=$(identify -format "%w" "$name")
    if [ "$width" -gt "$MAX_WIDTH" ]; then
      convert ${name} -verbose -resize $MAX_WIDTH ${name}
    fi
  done

echo "Done."
