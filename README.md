# kaizen-media-assets

Public asset bus for the Kaizen AI Consulting daily content pipeline.

Cowork renders each day's video and image here, then hands the raw URLs to
Zernio (LinkedIn / Instagram / TikTok / X) and to the n8n publisher
(WordPress featured image + Google Business Profile). Everything in this repo
is marketing material intended to be public.

## Layout

```
video/YYYY-MM-DD-slug.mp4    9:16 1080x1920 daily social video
image/YYYY-MM-DD-slug.jpg    featured image (WordPress + Google Business + X)
broll/                       cinematic 9:16 clips used as the video base track
engine/                      the Framer Motion video engine (see below)
```

URL patterns. Use jsDelivr for **video**, because raw.githubusercontent serves
MP4 as `application/octet-stream` and Zernio cannot then detect it as a video.
jsDelivr serves the correct `video/mp4`.

```
video  https://cdn.jsdelivr.net/gh/Prad-Patel/kaizen-media-assets@main/video/2026-07-28-example.mp4
image  https://raw.githubusercontent.com/Prad-Patel/kaizen-media-assets/main/image/2026-07-28-example.jpg
```

jsDelivr caches, so a re-pushed file under the same name can serve stale for a
while. Always use a fresh dated filename rather than overwriting one.

## engine/

The self-contained renderer for the daily 9:16 video. It builds two layers and
composites them, the same way the Campaign 1 and Campaign 2 ads were made.

The base is cinematic b-roll from `broll/`, cut into six segments on the
section beats, cropped to 1080x1920, graded toward the Kaizen navy and
vignetted. The overlay is the typography, rendered by Framer Motion in headless
Chromium and captured as transparent PNGs, so text is always pixel-sharp. No
text is ever AI-generated, which is what used to cause the distorted lettering.

The navy wash over the footage is a global grade across the whole frame, never
a panel sitting behind the text.

```bash
cd engine
./render.sh config.json ../video/2026-07-28-slug.mp4 22.0
```

`render.sh` installs dependencies on first run, bundles the composition,
injects the config, picks and grades the b-roll, captures 660 transparent
frames, generates the in-house music bed and composites the MP4. Expect roughly
six minutes end to end.

### config.json

```json
{
  "hook":  ["YOUR BUSINESS COULD", "RUN ITSELF."],
  "points": [["AI answers your calls at 2am."],
             ["Quotes drafted in minutes."],
             ["Invoices chased automatically."]],
  "stat":  { "pre": "MOST BUSINESSES TRY AI ONCE.",
             "big": "THEN GIVE UP.",
             "post": "THE RIGHT ONE PAYS FOR ITSELF." },
  "cta":     "FREE 30-MIN AI AUDIT",
  "tagline": "Find the automation that pays for itself.",
  "url":     "kaizenaiconsulting.com",
  "clips":   ["01-server-rack-lights.mp4", "07-empty-office-night.mp4",
              "06-hands-keyboard-macro.mp4", "02-office-dawn-laptop.mp4",
              "05-london-rooftops-dusk.mp4", "08-workshop-dawn-figure.mp4"]
}
```

`clips` is optional and names six files in `broll/`, one per section, so the
footage can be matched to the story. Leave it out and `pick_broll.py` seeds a
deterministic pick from the day's slug, which keeps re-runs reproducible while
consecutive days look different.

Timeline: hook 0–4.5s, three points 4.5–13.5s, stat 13.5–17.5s, end card
17.5–22.0s. The footage cuts on those same boundaries. Keep hook lines to three
or four words, points to about six words,
and `stat.big` to three words, or the type will wrap badly. The end-card
tagline auto-shrinks past 42 characters and wraps inside a 900px box, so a
longer tagline is safe, but under about 55 characters still reads best.

### Featured images

```bash
cd engine
./render_image.sh image_config.json ../image/2026-07-28-slug.jpg 1200 630
```

Same brand system, rendered as a single frame. Takes
`{ "kicker": "...", "headline": ["line", "line"], "tagline": "..." }`. Use
1200x630 for the WordPress featured image and Google Business, and 1080x1080
if you want a square card for X. Two headline lines read best; the second is
picked out in electric blue.

### Brand

Navy base `#0A1628`, electric blue `#2E7CF6`, teal `#34D3A6`, alert red
`#FF5A5F`. Space Grotesk for headlines, Inter for supporting copy. Shadows hug
the glyphs only, never a block-wide scrim behind the text.

Assets are kept for history. Nothing here is secret.
