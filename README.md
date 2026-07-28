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
engine/                      the Framer Motion video engine (see below)
```

Raw URL pattern:

```
https://raw.githubusercontent.com/Prad-Patel/kaizen-media-assets/main/video/2026-07-28-example.mp4
```

## engine/

The self-contained renderer for the daily 9:16 video. Text is real typography
rendered by Framer Motion in headless Chromium and captured frame by frame, so
it is always pixel-sharp. No text is ever AI-generated, which is what used to
cause the distorted lettering.

```bash
cd engine
./render.sh config.json ../video/2026-07-28-slug.mp4 22.0
```

`render.sh` installs dependencies on first run, bundles the composition,
injects the config, captures 660 frames, generates the in-house music bed and
encodes the MP4. Expect roughly six minutes end to end.

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

Timeline: hook 0–4.5s, three points 4.5–13.5s, stat 13.5–17.5s, end card
17.5–22.0s. Keep hook lines to three or four words, points to about six words,
and `stat.big` to three words, or the type will wrap badly.

### Brand

Navy base `#0A1628`, electric blue `#2E7CF6`, teal `#34D3A6`, alert red
`#FF5A5F`. Space Grotesk for headlines, Inter for supporting copy. Shadows hug
the glyphs only, never a block-wide scrim behind the text.

Assets are kept for history. Nothing here is secret.
