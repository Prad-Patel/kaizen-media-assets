#!/usr/bin/env python3
"""Build the graded b-roll base track that the Framer Motion typography sits on.

    python3 build_base.py <duration> <out.mp4> <clip1.mp4> [clip2.mp4 ...]

Six segments, cutting on exactly the same beats the typography changes on:

    hook 0-4.5 | point 1 | point 2 | point 3 | stat 13.5-17.5 | end card 17.5-22

Boundaries scale with total duration, the same way musicgen_daily.py scales its
sections, so a 26s video still cuts in the right places.

Every clip is cropped to 1080x1920, pushed toward the Kaizen navy, desaturated a
touch and vignetted, then the whole track gets an even navy wash so white
typography always has something to sit against. The wash is global grade, never
a panel behind the text. Over the end card the wash ramps up to near-solid navy
so the logo and CTA read cleanly.
"""
import json
import subprocess
import sys
import pathlib

NAVY = "0x0A1628"
DEEP = "0x070E1C"
WASH = 0.42          # constant navy wash over the footage
END_WASH = 0.93      # navy wash over the end card
SECTIONS = [4.5, 3.0, 3.0, 3.0, 4.0, 4.5]   # sums to 22.0


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def main():
    dur = float(sys.argv[1])
    out = sys.argv[2]
    clips = [pathlib.Path(p) for p in sys.argv[3:]]
    if not clips:
        sys.exit("build_base.py: no b-roll clips given")

    k = dur / 22.0
    segs = [s * k for s in SECTIONS]
    # cycle the clip list if fewer than six were supplied
    picks = [clips[i % len(clips)] for i in range(len(segs))]

    inputs, chains, labels = [], [], []
    for i, (clip, seg) in enumerate(zip(picks, segs)):
        d = probe_duration(clip)
        inputs += ["-i", str(clip)]
        if d >= seg + 0.02:
            # take the middle of the clip, where the camera move has settled
            start = max(0.0, (d - seg) / 2.0)
            time_fx = f"trim=start={start:.3f}:duration={seg:.3f},setpts=PTS-STARTPTS"
        else:
            # clip is short: slow it to fill the segment rather than freeze a tail
            factor = seg / d
            time_fx = (f"setpts={factor:.5f}*(PTS-STARTPTS),"
                       f"trim=duration={seg:.3f},setpts=PTS-STARTPTS")
        chains.append(
            f"[{i}:v]{time_fx},fps=30,"
            "scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,"
            "eq=contrast=1.05:saturation=0.80:brightness=-0.04,"
            "colorbalance=rm=-0.06:gm=-0.02:bm=0.09:rh=-0.03:bh=0.05,"
            "vignette=angle=PI/4.6,"
            f"format=yuv420p[v{i}]"
        )
        labels.append(f"[v{i}]")

    n = len(labels)
    end_start = sum(segs[:-1])
    fg = ";".join(chains) + ";"
    fg += "".join(labels) + f"concat=n={n}:v=1:a=0[cat];"
    fg += f"color=c={NAVY}:s=1080x1920:r=30:d={dur:.3f}[wash];"
    fg += f"[cat][wash]blend=all_mode=normal:all_opacity={WASH}[washed];"
    fg += (f"color=c={DEEP}:s=1080x1920:r=30:d={dur:.3f},format=yuva420p,"
           f"colorchannelmixer=aa={END_WASH},"
           f"fade=t=in:st={end_start - 0.35:.3f}:d=0.75:alpha=1[endwash];")
    fg += "[washed][endwash]overlay=format=auto,"
    fg += f"fade=t=in:st=0:d=0.5,fade=t=out:st={dur - 0.9:.3f}:d=0.9,format=yuv420p[out]"

    cmd = (["ffmpeg", "-y", "-loglevel", "error"] + inputs +
           ["-filter_complex", fg, "-map", "[out]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-pix_fmt", "yuv420p", "-r", "30", "-t", f"{dur:.3f}", out])
    subprocess.run(cmd, check=True)
    print(f"==> base track: {out}  ({n} clips, cuts at "
          + ", ".join(f"{sum(segs[:i+1]):.1f}s" for i in range(n - 1)) + ")")


if __name__ == "__main__":
    main()
