#!/usr/bin/env bash
# Render the daily hybrid video: generated footage of the day's illustration
# under the animated typography for the hook and points, then the flat paper
# stat card and navy end card as usual.
#
#   ./render_hybrid.sh config.json illustration_clip.mp4 out.mp4 [duration]
#
# The clip is the image-to-video animation of the day's UNTEXTED illustration
# (9:16). It is scaled/cropped to 1080x1920 and ping-pong looped under the
# overlay; from the stat onwards the paper backdrop is opaque so the footage
# no longer shows. The overlay is app_info.jsx with hybrid:true, captured as
# transparent PNGs, so every word stays real typography.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render_hybrid.sh <config.json> <clip.mp4> <out.mp4> [duration]}"
CLIP="${2:?usage: render_hybrid.sh <config.json> <clip.mp4> <out.mp4> [duration]}"
OUTMP4="${3:?usage: render_hybrid.sh <config.json> <clip.mp4> <out.mp4> [duration]}"
DUR="${4:-22.0}"
FPS=30

[ -d node_modules ] || npm install --no-audit --no-fund

echo "==> bundling"
./node_modules/.bin/esbuild ./src/app_info.jsx --bundle --outfile=dist/bundle.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

echo "==> injecting config (hybrid)"
python3 - "$CONFIG" "$DUR" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
cfg["duration"] = float(sys.argv[2])
cfg["hybrid"] = True
tpl = pathlib.Path("index.template.html").read_text()
pathlib.Path("index.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY

echo "==> building ping-pong base from clip"
ffmpeg -y -loglevel error -i "$CLIP" \
  -filter_complex "[0:v]fps=${FPS},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" \
  -map "[v]" -an -c:v libx264 -preset fast -crf 18 pingpong.mp4

echo "==> capturing typography frames"
rm -rf frames && DUR="$DUR" OUT=frames FPS="$FPS" node capture.js

echo "==> compositing"
ffmpeg -y -loglevel error \
  -stream_loop -1 -i pingpong.mp4 \
  -framerate "$FPS" -i frames/f%04d.png \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -filter_complex "[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -t "$DUR" -movflags +faststart \
  "$OUTMP4"

rm -rf frames pingpong.mp4
echo "==> done: $OUTMP4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUTMP4"
