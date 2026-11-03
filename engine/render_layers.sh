#!/usr/bin/env bash
# Render an opaque layered-animation base clip (no typography) from a scene
# config, using src/app_layers.jsx. Output is a 1080x1920 30fps MP4 that
# render_hybrid.sh then puts the typography over (use NO_PINGPONG=1 there).
#
#   ./render_layers.sh scene.json out_base.mp4 [duration]
set -euo pipefail
cd "$(dirname "$0")"
SCENE="${1:?usage: render_layers.sh <scene.json> <out.mp4> [duration]}"
OUT="${2:?usage: render_layers.sh <scene.json> <out.mp4> [duration]}"
DUR="${3:-14.0}"
FPS=30
[ -d node_modules ] || npm install --no-audit --no-fund
./node_modules/.bin/esbuild ./src/app_layers.jsx --bundle --outfile=dist/bundle_layers.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null
python3 - "$SCENE" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
tpl = pathlib.Path("index.template.html").read_text()
tpl = tpl.replace('dist/bundle.js', 'dist/bundle_layers.js')
pathlib.Path("index_layers.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY
rm -rf frames_layers && ENTRY=index_layers.html DUR="$DUR" OUT=frames_layers FPS="$FPS" node capture.js
ffmpeg -y -loglevel error -framerate "$FPS" -i frames_layers/f%04d.png \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$OUT"
echo "==> done: $OUT"
