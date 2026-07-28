#!/usr/bin/env python3
"""Choose six b-roll clips for a given day, deterministically.

    python3 pick_broll.py <broll-dir> [seed] [count]

Prints one path per line. The seed is normally the date slug, so the same day
always picks the same footage (re-runs are reproducible) while consecutive days
look different. Explicit clip choices belong in the config's "clips" key; this
is only the fallback when the config does not name any.
"""
import hashlib
import pathlib
import sys


def main():
    root = pathlib.Path(sys.argv[1])
    seed = sys.argv[2] if len(sys.argv) > 2 else "default"
    count = int(sys.argv[3]) if len(sys.argv) > 3 else 6

    clips = sorted(p for p in root.glob("*.mp4"))
    if not clips:
        sys.exit(f"pick_broll.py: no clips in {root}")

    # rank every clip by a hash of (seed, name) and take the top N, so the
    # selection is a stable shuffle rather than a rotation
    ranked = sorted(clips, key=lambda p: hashlib.sha256(
        f"{seed}:{p.name}".encode()).hexdigest())
    picks = [ranked[i % len(ranked)] for i in range(count)]
    print("\n".join(str(p) for p in picks))


if __name__ == "__main__":
    main()
