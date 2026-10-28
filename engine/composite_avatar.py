#!/usr/bin/env python3
"""Composite talking cartoon-avatar clips (colour-keyed) and their audio over a
rendered explainer video.

  composite_avatar.py spec.json

spec.json: {
  "base": "base.mp4",              # render_carousel_video.sh output, avatar omitted
  "out": "out.mp4",
  "bg": "0xE4EDFA",                # flat background colour of the avatar clips
  "target_h": 640,                 # figure height in the 1080x1350 frame
  "items": [{"clip": "c1.mp4", "start": 0.1, "dur": 7.0,
             "bbox": [x, y, w, h],   # figure bbox inside the 1024px source cell
             "cell": 1024}],         # source cell size the bbox was measured in
  "tail_audio": [{"file": "a5.wav", "start": 45.2}]   # voice with no avatar clip
}
Clips are expected square; the figure's bottom lands on the frame bottom and is
cropped to sit above the 116px footer bar, so the bar stays on top."""
import json, subprocess, sys

spec = json.load(open(sys.argv[1]))
H, FOOT = 1350, 116
items, tails = spec["items"], spec.get("tail_audio", [])
s = spec.get("target_h", 640) / 950.0
inputs = ["-i", spec["base"]]
for it in items:
    inputs += ["-i", it["clip"]]
for t in tails:
    inputs += ["-i", t["file"]]
fc, last = [], "0:v"
for i, it in enumerate(items):
    x, y, w, h = it["bbox"]
    size = round(it.get("cell", 1024) * s)
    ox, oy = round(10 - x * s), round(H - (y + h) * s)
    ch = H - FOOT - oy
    st, en = it["start"], it["start"] + it["dur"]
    fc.append(f"[{i+1}:v]colorkey={spec.get('bg','0xE4EDFA')}:0.075:0.04,"
              f"fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st={it['dur']-0.3}:d=0.3:alpha=1,"
              f"scale={size}:{size},crop={size}:{ch}:0:0,setpts=PTS-STARTPTS+{st}/TB[v{i}]")
    fc.append(f"[{last}][v{i}]overlay={ox}:{oy}:enable='between(t,{st},{en})':eof_action=pass[o{i}]")
    last = f"o{i}"
aud = []
for i, it in enumerate(items):
    fc.append(f"[{i+1}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={int(it['start']*1000)}:all=1[a{i}]")
    aud.append(f"[a{i}]")
for j, t in enumerate(tails):
    k = len(items) + 1 + j
    fc.append(f"[{k}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={int(t['start']*1000)}:all=1[t{j}]")
    aud.append(f"[t{j}]")
fc.append("".join(aud) + f"amix=inputs={len(aud)}:normalize=0:dropout_transition=0[aout]")
cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs + ["-filter_complex", ";".join(fc), "-map", f"[{last}]",
       "-map", "[aout]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
       "-shortest", spec["out"]]
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stderr[-800:] or "done: " + spec["out"])
sys.exit(r.returncode)
