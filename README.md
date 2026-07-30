# kaizen-media-assets

Public asset bus for the Kaizen AI Consulting daily content pipeline.

Cowork renders each day's video and image here, then hands the raw URLs to
Zernio (LinkedIn / Instagram / TikTok / X) and to the n8n publisher
(WordPress featured image + Google Business Profile). Everything in this repo
is marketing material intended to be public.

## Layout

```
video/YYYY-MM-DD-slug.mp4         9:16 1080x1920 daily social video, silent
image/YYYY-MM-DD-slug-4x5.jpg     1080x1350 social card (X and the feeds)
image/YYYY-MM-DD-slug-wide.jpg    1200x630 featured image (WordPress + GMB)
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

The self-contained renderer for the daily 9:16 video.

The house style is the **animated infographic**: the same flat-vector look
Kaizen already uses on its posts, but drawn as real vector art and animated
rather than generated as a picture. Light paper background, navy ink, electric
blue and teal. A monitor running everyday software sits above an engine bay
where the model underneath is swapped out, dashed leader lines run to a rail in
the left margin, and the three points land on it one at a time.

Everything in frame is drawn by Framer Motion in headless Chromium and captured
as deterministic PNGs. Nothing is AI-painted, so lettering is never distorted or
misspelled and the brand colours are exact.

```bash
cd engine
./render_info.sh config.json ../video/2026-07-28-slug.mp4 22.0
```

`render_info.sh` installs dependencies on first run, bundles the composition,
injects the config, captures 660 frames, generates the in-house music bed and
encodes the MP4. Expect roughly four minutes end to end.

`render.sh` is the older two-layer build, which composites the typography over
cinematic b-roll from `broll/`. It still works and is kept for the campaign-ad
treatment, but it is not what the daily post uses.

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
  "url":     "kaizenaiconsulting.com"
}
```

`clips` is only read by the older `render.sh` b-roll build. It names six files
in `broll/`, one per section; leave it out and `pick_broll.py` seeds a
deterministic pick from the day's slug.

Timeline: hook 0–4.5s, three points 4.5–13.5s, stat 13.5–17.5s, navy sweep and
end card 17.5–22.0s. The scene beats on the same boundaries: the old model
lifts out at 5.0s, the new one seats at 6.5s, the software panels light up on
point two, and the outer shell is picked out on point three. Keep hook lines to
three or four words, points to about six words,
and `stat.big` to three words, or the type will wrap badly. The end-card
tagline auto-shrinks past 42 characters and wraps inside a 900px box, so a
longer tagline is safe, but under about 55 characters still reads best.

The daily video is **silent**. Feeds autoplay muted and the captions carry the
argument, so a bed under 22 seconds of infographic added nothing. The in-house
`musicgen_daily.py` bed is still there for a one-off: `MUSIC=1 ./render_info.sh …`.

### Still cards

```bash
cd engine
./render_card.sh card_config.json ../image/2026-07-28-slug-4x5.jpg  1080 1350
./render_card.sh card_config.json ../image/2026-07-28-slug-wide.jpg 1200 630
```

`render_card.sh` freezes the same animated-infographic drawing: light paper,
navy ink, the monitor above the engine bay, the dashed rail carrying the
points, and a navy footer bar. It is literally the same vector geometry the
video uses, so the still and the video read as one piece.

```json
{
  "kicker":   "Microsoft's in-house AI models",
  "headline": ["Same Copilot.", "New brain."],
  "points":   [["Microsoft swapped the model underneath."],
               ["Code tasks: 60% fewer tokens."],
               ["Excel and Outlook are switching too."]],
  "url":      "kaizenaiconsulting.com"
}
```

`points` takes the same shape as the video config, so both configs can be built
from one set of lines. Ratios: **1080x1350 (4:5)** is the default and what the
social posts use, 1080x1920 for a 9:16 story card, 1200x630 for the landscape
WordPress featured image and Google Business. The layout reflows between
portrait and landscape on its own. Two headline lines read best, the second is
picked out in electric blue, and points want about six words each.

`render_image.sh` is the older dark-gradient card. It is kept for reference but
is not what the daily post uses.

### Brand

Navy base `#0A1628`, electric blue `#2E7CF6`, teal `#34D3A6`, alert red
`#FF5A5F`. The infographic runs on light paper `#EAF0F9` with navy ink and no
shadows at all. Space Grotesk for headlines, Inter for supporting copy. Where
type does sit over imagery, shadows hug the glyphs only, never a block-wide
scrim behind the text.

Assets are kept for history. Nothing here is secret.
