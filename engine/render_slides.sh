#!/usr/bin/env bash
# Render the explainer video: hook over a layered-scene base clip, then
# morphing information slides and the Kaizen end card, all Framer Motion.
#
#   ./render_slides.sh slides.json base_scene.mp4 out.mp4
# slides.json carries "times" (slide start times), "duration" and the copy.
# base_scene.mp4 comes from render_layers.sh and plays under the hook slide only.
set -euo pipefail
cd "$(dirname "$0")"
CFG="${1:?usage: render_slides.sh <slides.json> <base.mp4> <out.mp4>}"
BASE="${2:?}"; OUT="${3:?}"
FPS=30
DUR=$(python3 -c "import json,sys;print(json.load(open('$CFG'))['duration'])")
[ -d node_modules ] || npm install --no-audit --no-fund
./node_modules/.bin/esbuild ./src/app_slides.jsx --bundle --outfile=dist/bundle_slides.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null
python3 - "$CFG" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
tpl = pathlib.Path("index.template.html").read_text().replace('dist/bundle.js', 'dist/bundle_slides.js')
pathlib.Path("index_slides.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY
rm -rf frames_slides && ENTRY=index_slides.html DUR="$DUR" OUT=frames_slides FPS="$FPS" node capture.js
ffmpeg -y -loglevel error -i "$BASE" -framerate "$FPS" -i frames_slides/f%04d.png \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -filter_complex "[0:v]fps=${FPS},tpad=stop_mode=clone:stop_duration=${DUR}[b];[b][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k \
  -t "$DUR" -movflags +faststart "$OUT"
echo "==> done: $OUT"
