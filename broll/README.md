# b-roll library

Cinematic 9:16 clips that sit underneath the Framer Motion typography in every
daily social video.

`engine/build_base.py` cuts six segments out of this library on the section
beats (hook, three points, stat, end card), crops each to 1080x1920, grades it
toward the Kaizen navy and vignettes it. The typography is composited over the
top as transparent PNGs, so no on-screen text is ever AI-generated.

Naming: short kebab-case description of the shot, e.g. `server-rack-lights.mp4`.
Anything in here is fair game for any day's video. To pin a specific day's
footage, name the files in that day's config under a `clips` array; otherwise
`pick_broll.py` seeds a deterministic pick from the date slug.

Source clips do not need to be 1080x1920 - they are scaled and cropped at
build time.
