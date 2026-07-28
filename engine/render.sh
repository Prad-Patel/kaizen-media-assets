#!/usr/bin/env bash
# Render one daily 9:16 social video from a config JSON.
#
#   ./render.sh config.json out.mp4 [duration]
#
# Two layers, composited the same way the Campaign 1 and 2 ads were built:
#
#   base   cinematic b-roll from ../broll, cut on the section beats and graded
#          toward the Kaizen navy (build_base.py)
#   over   the typography, rendered by Framer Motion in headless Chromium and
#          captured as transparent PNGs, so text is always pixel-sharp and never
#          AI-painted
#
# Pick footage explicitly with a "clips" array in the config (names relative to
# ../broll). Leave it out and the day's slug seeds a deterministic pick.
set -euo pipefail
cd "$(dirname "$0")"

CONFIG="${1:?usage: render.sh <config.json> <out.mp4> [duration]}"
OUTMP4="${2:?usage: render.sh <config.json> <out.mp4> [duration]}"
DUR="${3:-22.0}"
FPS=30
BROLL="${BROLL_DIR:-../broll}"

[ -d node_modules ] || npm install --no-audit --no-fund

echo "==> bundling"
./node_modules/.bin/esbuild ./src/app_social.jsx --bundle --outfile=dist/bundle.js \
  --loader:.jsx=jsx --define:process.env.NODE_ENV='"production"' >/dev/null

echo "==> injecting config"
python3 - "$CONFIG" "$DUR" <<'PY'
import json, sys, pathlib
cfg = json.load(open(sys.argv[1]))
cfg["duration"] = float(sys.argv[2])
tpl = pathlib.Path("index.template.html").read_text()
pathlib.Path("index.html").write_text(tpl.replace("/*__CONFIG__*/", json.dumps(cfg, ensure_ascii=False)))
PY

echo "==> selecting b-roll"
SEED="$(basename "$OUTMP4" .mp4)"
mapfile -t CLIPS < <(python3 - "$CONFIG" "$BROLL" "$SEED" <<'PY'
import json, pathlib, subprocess, sys
cfg = json.load(open(sys.argv[1]))
root = pathlib.Path(sys.argv[2])
named = cfg.get("clips") or []
if named:
    for n in named:
        p = root / n
        if not p.exists():
            sys.exit(f"config names a clip that is not in {root}: {n}")
        print(p)
else:
    subprocess.run([sys.executable, "pick_broll.py", str(root), sys.argv[3], "6"], check=True)
PY
)
printf '    %s\n' "${CLIPS[@]##*/}"

echo "==> building base track"
python3 build_base.py "$DUR" base.mp4 "${CLIPS[@]}"

echo "==> capturing typography frames"
rm -rf frames && DUR="$DUR" OUT=frames FPS="$FPS" node capture.js

echo "==> generating music bed"
python3 musicgen_daily.py "$DUR" music.wav

echo "==> compositing"
ffmpeg -y -loglevel error \
  -i base.mp4 \
  -framerate "$FPS" -i frames/f%04d.png \
  -i music.wav \
  -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$OUTMP4"

rm -rf frames base.mp4
echo "==> done: $OUTMP4"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUTMP4"
