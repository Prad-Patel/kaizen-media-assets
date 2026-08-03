#!/usr/bin/env python3
"""Choose overlay text tones by looking at the footage behind each text block.

Usage: pick_text_style.py base.mp4 > textplan.json

Samples the frames behind the hook and each point label during the window that
text is on screen, measures mean luminance of the region, and picks a tone:
"ink" (navy type, light halo) on light backgrounds, "light" (white type, dark
glyph shadow) on dark ones. The plan is merged into the config that
app_info.jsx reads, so the choice is per-day and per-element, automatically.
"""
import json
import subprocess
import sys
import tempfile
import os

CLIP = sys.argv[1]

# region boxes on the 1080x1920 canvas: (crop_w, crop_h, x, y)
HOOK_BOX = (854, 450, 96, 150)
ROWS = [1305, 1470, 1635]
LABEL_BOXES = [(810, 168, 150, r - 84) for r in ROWS]

# sample times inside each element's visibility window
HOOK_T = [1.2, 4.0, 7.0, 10.0, 12.8]
LABEL_T = [[5.5, 8.5, 12.5], [8.7, 10.5, 12.5], [11.5, 12.7]]

INK_THRESHOLD = 0.55  # mean gray above this = light background = navy type


def region_mean(t, box):
    w, h, x, y = box
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        tmp = f.name
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", CLIP,
             "-frames:v", "1", tmp], check=True)
        out = subprocess.run(
            ["convert", tmp, "-crop", f"{w}x{h}+{x}+{y}", "-colorspace", "Gray",
             "-format", "%[fx:mean]", "info:"],
            check=True, capture_output=True, text=True).stdout.strip()
        return float(out)
    finally:
        os.unlink(tmp)


def tone_for(times, box):
    means = [region_mean(t, box) for t in times]
    worst = min(means)  # the darkest moment decides
    return ("ink" if worst >= INK_THRESHOLD else "light"), round(worst, 3)


hook_tone, hook_lum = tone_for(HOOK_T, HOOK_BOX)
labels = []
lums = []
for i, box in enumerate(LABEL_BOXES):
    tone, lum = tone_for(LABEL_T[i], box)
    labels.append(tone)
    lums.append(lum)

json.dump({"hook": hook_tone, "labels": labels,
           "debug": {"hookLum": hook_lum, "labelLums": lums}}, sys.stdout)
