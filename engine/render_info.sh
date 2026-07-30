#!/usr/bin/env bash
# Render one daily 9:16 social video as an animated infographic.
#
#   ./render_info.sh config.json out.mp4 [duration]
#
# Single layer. The whole frame - flat vector scene, leader lines, labels,
# end card - is drawn by Framer Motion in headless Chromium and captured as
# deterministic PNGs, then encoded with the in-house music bed. Nothing is
# AI-generated, so no lettering is ever distorted and the brand colours are
# exact.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_info.sh <config.json> <out.mp4> [duration]}"
OUTMP4="${2:?usage: render_info.sh <config.json> <out.mp4> [duration]}"
DUR="${3:-22.0}"
FPS=30

[ -d node_modules ] || npm install --no-audit --no-fund

echo "==> bundling"
./node_modules/.bin/esbuild ./src/app_info.jsx --bundle --outfile=dist/bundle.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

echo "==> injecting config"
python3 - "$CONFIG" "$DUR" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
cfg["duration"] = float(sys.argv[2])
tpl = pathlib.Path("index.template.html").read_text()
pathlib.Path("index.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY

echo "==> capturing frames"
rm -rf frames && DUR="$DUR" OUT=frames FPS="$FPS" node capture.js

# The daily post is silent. Feeds autoplay muted, the captions carry the
# argument, and a bed under a 22 second infographic added nothing. Set
# MUSIC=1 to bring the in-house bed back for a one-off.
if [ "${MUSIC:-0}" = "1" ]; then
  echo "==> generating music bed"
  python3 musicgen_daily.py "$DUR" music.wav
  echo "==> encoding (with music)"
  ffmpeg -y -loglevel error \
    -framerate "$FPS" -i frames/f%04d.png \
    -i music.wav \
    -filter_complex "[0:v]format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -shortest -movflags +faststart \
    "$OUTMP4"
else
  echo "==> encoding (silent)"
  ffmpeg -y -loglevel error \
    -framerate "$FPS" -i frames/f%04d.png \
    -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
    -movflags +faststart \
    "$OUTMP4"
fi

rm -rf frames
echo "==> done: $OUTMP4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUTMP4"
