#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Rebuilds every video-derived asset used by the site from the raw sources
# kept in source/videos/ (goat.mp4, rooster.mp4, sparrow.mp4).
#
# Requirements: ffmpeg (with libwebp, libx264 and libvpx-vp9).
# Usage (from the repository root):   bash tools/prepare_media.sh
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site/assets"
mkdir -p "$SITE/frames/goat" "$SITE/video"

echo "→ Goat: image sequence for the scroll-driven hero"
# Every 2nd frame of the 6 s / 30 fps clip → 91 WebP frames, 1280 px wide.
# If you change the frame count, update GOAT_FRAMES.count in site/js/config.js.
rm -f "$SITE/frames/goat/"*.webp
ffmpeg -v error -y -i "$ROOT/source/videos/goat.mp4" \
  -vf "select='not(mod(n\,2))',scale=1280:-1" -vsync vfr \
  -c:v libwebp -quality 68 "$SITE/frames/goat/g%03d.webp"

echo "→ Rooster: 5.5 s portrait crop without the green bin in the background"
ffmpeg -v error -y -ss 10.5 -i "$ROOT/source/videos/rooster.mp4" -t 5.5 \
  -vf "crop=576:720:200:0,fps=25" -an \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart \
  "$SITE/video/rooster.mp4"

echo "→ Sparrow: 7 s loop"
ffmpeg -v error -y -ss 2 -i "$ROOT/source/videos/sparrow.mp4" -t 7 \
  -vf "scale=1280:-1,fps=24" -an \
  -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart \
  "$SITE/video/sparrow.mp4"

echo "→ WebM (VP9) versions — served first, MP4 is the fallback"
ffmpeg -v error -y -ss 10.5 -i "$ROOT/source/videos/rooster.mp4" -t 5.5 \
  -vf "crop=576:720:200:0,fps=25" -an -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 \
  "$SITE/video/rooster.webm"
ffmpeg -v error -y -ss 2 -i "$ROOT/source/videos/sparrow.mp4" -t 7 \
  -vf "scale=1280:-1,fps=24" -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 \
  "$SITE/video/sparrow.webm"

echo "→ Posters (first frame, shown before the videos start)"
ffmpeg -v error -y -i "$SITE/video/rooster.mp4"   -frames:v 1 -c:v libwebp -quality 70 "$SITE/video/rooster-poster.webp"
ffmpeg -v error -y -i "$SITE/video/sparrow.mp4" -frames:v 1 -c:v libwebp -quality 70 "$SITE/video/sparrow-poster.webp"

echo "Done."
