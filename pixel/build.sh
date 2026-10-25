#!/usr/bin/env bash
# 像素版整片：bash pixel/build.sh <原视频.mp4>（只取音轨） → pixel/out/mv_pixel.mp4
set -e
cd "$(dirname "$0")"
SRC="$1"; N=3810; mkdir -p out/seg
for k in 0 1 2 3; do node render.js frames $((k*N/4)) $(((k+1)*N/4)) out/seg/p$k.mp4 & done; wait
printf "file 'p0.mp4'\nfile 'p1.mp4'\nfile 'p2.mp4'\nfile 'p3.mp4'\n" > out/seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/seg/list.txt -c copy out/silent.mp4
if [ -n "$SRC" ]; then
  ffmpeg -v error -y -i out/silent.mp4 -i "$SRC" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out/mv_pixel.mp4
fi
