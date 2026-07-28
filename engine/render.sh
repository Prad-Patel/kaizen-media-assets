#!/usr/bin/env bash
# Render one daily 9:16 social video from a config JSON.
#
#   ./render.sh config.json out.mp4 [duration]
#
# Everything on screen is real typography rendered by Framer Motion in headless
# Chromium, so text is always pixel-sharp. Nothing is AI-painted.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render.sh <config.json> <out.mp4> [duration]}"
OUTMP4="${2:?usage: render.sh <config.json> <out.mp4> [duration]}"
DUR="${3:-22.0}"
FPS=30

[ -d node_modules ] || npm install --no-audit --no-fund

echo "==> bundling"
./node_modules/.bin/esbuild ./src/app_social.jsx --bundle --outfile=dist/bundle.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

echo "==> injecting config"
python3 - "$CONFIG" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
tpl = pathlib.Path("index.template.html").read_text()
pathlib.Path("index.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY

echo "==> capturing frames"
rm -rf frames && DUR="$DUR" OUT=frames FPS="$FPS" node capture.js

echo "==> generating music bed"
python3 musicgen_daily.py "$DUR" music.wav

echo "==> encoding"
ffmpeg -y -loglevel error \
  -framerate "$FPS" -i frames/f%04d.png \
  -i music.wav \
  -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$OUTMP4"

rm -rf frames
echo "==> done: $OUTMP4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUTMP4"
