# Kaizen daily content pipeline — runbook

This is the operating manual for the automated daily content run. A fresh
Claude Code routine session fires at 8am UK time each day, reads this
document from the repository root, and follows it end to end.

Nothing here is secret. Credentials live in the routine's own configuration
and in the n8n and Zernio connectors, never in this document. The routine has
its own GitHub credential for this repository, so no personal access token
should ever appear in a clone URL or a config file.

## What the run produces

One topic from the queue becomes six pieces of output:

| Destination | Media | Delivered by |
|---|---|---|
| WordPress blog post | 3:2 Gemini cover (typography composited) | n8n publisher |
| Google Business Profile | 3:2 Gemini cover | n8n publisher |
| LinkedIn | hybrid video | Zernio |
| Instagram | hybrid video, with the 4:5 Gemini cover as reel cover | Zernio |
| TikTok | hybrid video, with the 4:5 Gemini cover as video cover | Zernio |
| X | 4:5 Gemini cover | Zernio |

Prad approves the drafts before anything goes live. Nothing publishes
unattended.

## Systems and identifiers

**Topic queue** — Google Sheet "Kaizen AI Blog Automation", document
`1Am_uZBqtZoEaTN6EJoba4wFGgwuxNQiGoVYN4t7THFg`, first tab. Columns: Topic,
Keyword, Status, row_number. Take the first row where Status is `Pending`. Set
it to `Complete` only after the post is actually live. The queue ran dry on
2026-09-06 (every row Complete) and the Sheet connector cannot insert new
rows, only update Status on existing ones, so it cannot be refilled from the
session. Per the daily-sequence step below, an empty queue is no longer a
stop condition: generate a topic for the day instead and log it as a dynamic
topic. Still check this sheet first each day in case Prad has added fresh
Pending rows some other way.

**Sheet updater** — n8n workflow `96DUquYtdDHveiqF`, "Kaizen — Sheet Status
Updater (Cowork)", published. The Google Drive connector is read-only, so
status changes go through this workflow. Drive it with `execute_workflow` and
`inputs: { type: 'webhook', webhookData: { body: { topic, status } } }`. It
matches the first row whose Topic equals `topic`, sets its Status, and returns
`{ row_number, Status }`. It uses the "Prad Patel" Google Sheets credential;
the older "Google Sheets account" credential is revoked and needs reconnecting
before anything uses it again.

**Asset bus** — this repository, `Prad-Patel/kaizen-media-assets`. Every piece
of media has to land here and be served from a public URL, because the session
cannot reach the publishing hosts directly.

Use different hosts for the two media types, and this matters:

```
video      https://cdn.jsdelivr.net/gh/Prad-Patel/kaizen-media-assets/video/YYYY-MM-DD-slug.mp4
3:2 cover  https://raw.githubusercontent.com/Prad-Patel/kaizen-media-assets/main/image/YYYY-MM-DD-slug-3x2.jpg
4:5 cover  https://raw.githubusercontent.com/Prad-Patel/kaizen-media-assets/main/image/YYYY-MM-DD-slug-4x5.jpg
9:16 base  https://raw.githubusercontent.com/Prad-Patel/kaizen-media-assets/main/image/YYYY-MM-DD-slug-9x16.jpg
```

raw.githubusercontent serves MP4 as `application/octet-stream`, and Zernio then
reads the media type as unknown rather than as video. jsDelivr serves the
correct `video/mp4`.

**The video URL must be the version-less jsDelivr form, with no `@main`.**
Learned the hard way on 2026-07-31: platform fetchers (LinkedIn's uploader,
Meta's and TikTok's pull-from-URL) percent-encode the `@` to `%40` and jsDelivr
answers HTTP 400, so every video post fails after Zernio accepts it, while
`validate_media` passes because it sends the URL verbatim. The version-less
form resolves to the default branch and has no `@` to mangle.

jsDelivr also caches aggressively, so never overwrite a filename, always use a
fresh dated one. If a file has to be re-rendered on the same day, add an `-r2`
suffix rather than pushing over it. Verify every URL with `validate_media`
before presenting drafts, and after publishing check each post with
`posts_get`: `posts_create` returns "Published" optimistically and media
failures only show up in the post status a minute later. The raw error is in
the generic `posts_get_post` tool (via `call_tool`) under
`platforms[].errorMessage`.

**Push access.** The routine has this repository attached, so `git push` works
with the credential the platform injects. Never add a PAT to the clone URL.
Before spending any Gemini or Higgsfield credits, run `git push --dry-run
origin main`. If it fails with a proxy authorization error, stop and tell Prad
rather than building assets that cannot be published. Between 2026-08-05 and
2026-08-08 the pipeline ran as a Cowork scheduled task, which has no way to
attach a repository, and four days of content were blocked by exactly this.
The check exists so that failure mode is caught in seconds rather than after a
full build.

**A 409 duplicate error from `posts_create` is NOT reliable.** On 2026-07-31,
four `posts_create` calls returned "[409] This exact content is already
scheduled..." and every one of them still created AND published the post.
After any 409, do not simply retry: list recent posts (`posts_list` or the
generic `posts_list_posts`) and check whether the post actually went out. The
duplicates that got through were removed the same day with
`posts_unpublish_post`, which deletes the post from the platform itself.
Zernio's documented dedup hashes `(platform, account, content + media URLs)`
over 24 hours and deleting a post does not clear the window.

**Cover images — Gemini via n8n.** The daily stills are topic-specific
illustrations generated by Gemini (Nano Banana Pro), with real typography
composited on top afterwards so no text is ever AI-painted.

- Generator: n8n workflow `FqYH4E3KZywda1ON`, "Kaizen — Gemini Image Gen
  (Cowork)", published. Drive with `execute_workflow`, `inputs: { type:
  'webhook', webhookData: { body: { prompt } } }`. It returns the image as
  base64; read it from the execution's "Binary to Base64" node output
  (`json.imageBase64`, the get_execution result lands in a file, `jq` it out
  and `base64 -d` to disk). It must use the "Google Gemini(PaLM) Api account"
  credential (`sZMyAvp58Aeap9LM`); the "account 2" credential is free tier
  with zero image quota and 429s instantly.
- Three images per day: a 3:2 (blog featured image + Google Business, the
  ratio the blog theme shows uncropped), a 4:5 (X post image, Instagram reel
  cover, TikTok cover), and a 9:16 (the base for the hybrid video, subject in
  the middle band with generous clear background in the top third and bottom
  quarter).
- Prompt rules: describe a scene that expresses the day's angle (vary it every
  day, this is the point), then append the house style: "Flat design vector
  illustration with simple geometric shapes, minimal shading, clean lines, and
  a modern 2D style. Colour palette: deep navy ink, electric blue, teal
  accents, on a very light blue-grey paper background." Always demand:
  absolutely no text, words, letters, numbers, logos or flags in the image,
  state the output ratio, and ask for clear space where the type will sit
  (top-left for 3:2, top third for 4:5, top third + bottom quarter for 9:16).
  Text is added afterwards, never generated. For the 9:16, also demand the
  background be one single continuous uniform colour from top edge to bottom
  edge with no bands, panels or stripes: on 2026-08-04 the first 9:16 came
  back with visibly different shades in the top/middle/bottom bands, which
  would have shown as seams in the animated video, and the uniform-background
  wording fixed it in one regeneration.
- Overlay: `engine/render_cover.sh cover_config.json out.jpg W H` composites
  kicker + two-line headline (Space Grotesk/Inter, navy + electric blue,
  glyph-hugging light halo, no scrims) and the K logo over the illustration.
  `cover_config.json` is `{ image, kicker, headline: [two lines], footer }`;
  `footer: true` adds the navy footer bar (use it on the 4:5). Sizes: 1200x800
  for the 3:2, 1080x1350 for the 4:5. The headline is set at a fixed size and
  does not auto-fit, so check the render: on the 3:2, a long second line ran
  into the artwork on 2026-08-04 and needed a shorter line. Headline lines on
  the 3:2 want to fit the top-left clear space, roughly 20 characters or fewer
  per line; on 2026-08-05 even 16/18-character lines grazed centre-frame
  artwork, and a 14/14 pair ("A sentence in." / "A website out.") was needed,
  so check the render every time rather than trusting the character count.
- Push the covers to `image/YYYY-MM-DD-slug-3x2.jpg` and `-4x5.jpg` and the
  9:16 base illustration to `-9x16.jpg`, and verify with `validate_media`.

**Gemini gen + presigned upload** — n8n workflow `K0jltbPnAeLzKBmr`, "Kaizen —
Gemini Gen + Presigned Upload (Cowork)", published. Body `{ prompt, uploadUrl,
contentType }`: generates the image with the paid Gemini credential, PUTs the
bytes server-side to any presigned upload URL (n8n cloud can reach
upload.higgsfield.ai even when the session cannot), and returns the same image
as base64 (read `json.imageBase64` from the "Binary to Base64" node) so the
identical illustration is used for the local hybrid composite. Flow: Higgsfield
`media_upload` for a presigned URL and media_id, run this workflow, then
`media_confirm`. Presigned URLs expire in 15 minutes, so run the workflow
straight after requesting one. Two gotchas baked in: extractFromFile needs
`keepSource: both` or it eats the binary before the PUT, and n8n
`update_workflow` edits the draft only, so `publish_workflow` must be called
again or production keeps running the old version. A generic
`{ uploadUrl, contentType, fileBase64 }` PUT-only variant also exists:
`BsFqwIIUIQbtn735`, "Kaizen — Media Upload PUT (Cowork)" (not usable for large
files, the base64 has to fit through a tool call; use the gen+upload workflow
for daily images instead).

This route is only needed when the repository is unreachable. With push access
working, use the normal path: push the 9:16 to the repo and import it into
Higgsfield with `media_import_url`.

**Daily video — hybrid.** The video is an animated version of the day's
illustration: the untexted 9:16 illustration is animated by an image-to-video
model, and the engine's typography (hook, three points on the rail, then the
flat-paper stat card and navy end card) is composited over the footage. Every
word stays real typography; the footage never contains text.

1. Push the 9:16 untexted illustration to the repo, then import it into
   Higgsfield with `media_import_url` on the raw.githubusercontent URL.
2. Generate the clip with `generate_video`: model `kling3_0_turbo`,
   `duration: 10`, `aspect_ratio: '9:16'`, the illustration as `start_image`.
   Prompt pattern: "Subtle, polished 2D motion-graphics animation of this flat
   vector illustration. The camera holds almost still with the gentlest slow
   push in." then describe the specific elements moving, and always end: "The
   empty light background areas at the top and bottom of the frame stay clean
   and still. Everything stays perfectly flat 2D vector style, clean and
   geometric, no camera shake, no added text, no new objects, smooth
   loop-friendly motion." Cost is ~15 credits; check `balance` first and tell
   Prad if it is below ~35 (he has approved the daily spend). Higgsfield may
   answer with a `preset_recommendation` notice instead of submitting; for the
   daily pipeline always decline by retrying the same params with
   `declined_preset_id` set to the offered preset id.
2a. **If the Higgsfield balance is below the ~15 credit cost of one
    generation, do not attempt the i2v call.** Prad's standing instruction
    (2026-08-13): build the video anyway using the static illustration
    instead of animated footage, rather than blocking the whole draft on a
    top-up. `render_hybrid.sh` does not care whether its `clip.mp4` moves,
    only that it exists, so make one with ffmpeg: `ffmpeg -y -loop 1 -i
    illustration-9x16.jpg -t 11 -r 30 -pix_fmt yuv420p -vf
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    static_clip.mp4`, then pass that as the clip argument exactly as if it
    were the Higgsfield clip. **The clip must be at least 11 seconds**:
    `pick_text_style.py` samples the ping-pong footage out to ~12.8s (built
    for a 10s source clip pingponged to ~20s), and a shorter static clip
    makes `ffmpeg -ss` seek past end-of-file, which silently writes a 0-byte
    PNG and crashes `convert` with "improper image header" (hit and fixed
    2026-08-13, cost about 20 minutes of debugging). Only run the real
    Higgsfield `generate_video` call once the balance covers it; this static
    fallback is not a replacement for the animated build, just what runs
    when credit does not allow it.
3. Pull the finished clip into the session via n8n workflow
   `T89V0h08JMpWkCE5`, "Kaizen — Media Fetch (Cowork)": `execute_workflow`
   with body `{ url }`, read `fileBase64` from the "Media to Base64" node of
   the execution and decode. (The Higgsfield CDN is unreachable from the
   session; n8n fetches it and hands it over as base64.) Skip this step
   entirely when using the static-stills fallback above; there is no clip to
   fetch.
4. `./engine/render_hybrid.sh config.json clip.mp4 out.mp4 22.0`. The clip is
   ping-pong looped under the first section; from the stat onwards the paper
   backdrop is opaque. The script also runs `pick_text_style.py`
   automatically: it samples the footage behind the hook and each label
   during the seconds that text is on screen and switches each element
   between navy type with a light halo (light background) and white type
   with a dark glyph shadow (dark background), so the type never clashes
   with the day's artwork. The output already carries the silent AAC track,
   no separate remux step.
5. QC frames (hook ~2.5s, points ~6s and ~12.5s, stat 15-17.3s; 17.6s is
   already the navy sweep). If the generation warped or drifted off-style,
   regenerate once with the same prompt; if it is still bad, fall back to the
   pure vector build (`render_info.sh` with a suitable `scene`) so the 8am
   run never stalls. If the illustration leaves less clearance than usual and
   the three points still crowd its bottom edge after one illustration
   regeneration, do not keep spending Higgsfield credits on further attempts:
   drop `labelFontSize` in config.json (try 32-34, below the 40 default) for
   a smaller footprint on the same fixed rail geometry, or cut point text to
   three or four words each so it wraps to at most two lines, or cut to two
   points, rather than re-rolling the art again. Learned 2026-08-09 rebuilding
   the blocked 2026-08-05 Canva post: the illustration needed three
   regenerations to clear the rail, and Prad asked for this as the standing
   fallback so it does not take that long again. Corrected 2026-08-28: the
   code default is 40, not 54 as this section previously said, so setting
   `labelFontSize` to a value above 40 (44 was tried) makes the crowding
   worse, not better; the row box is 168px tall on a 165px row gap, so
   anything beyond two wrapped lines collides with the next point.

`config.json` is `{ hook, points, stat, cta, tagline, url, labelFontSize }`;
`labelFontSize` is optional, defaults to 40 (`engine/src/app_info.jsx`,
`LABEL_FONT`), and only needs setting when a day's illustration is unusually
bottom-heavy, in which case lower it rather than raise it. `scene` is only
used by the fallback. `render_hybrid.sh` sets `hybrid: true` and the text
plan itself.

**Render engine** — `engine/` in this repository, self-contained:

```
./engine/render_hybrid.sh config.json clip.mp4      video/YYYY-MM-DD-slug.mp4  22.0
./engine/render_cover.sh  cover_config.json         image/YYYY-MM-DD-slug-3x2.jpg  1200 800
./engine/render_cover.sh  cover_config.json         image/YYYY-MM-DD-slug-4x5.jpg  1080 1350
./engine/render_info.sh   config.json               video/... .mp4  22.0   (fallback, pure vector)
```

Run `npm install` in `engine/` after a fresh clone; `render_cover.sh` does not
install dependencies itself and fails with a missing `playwright-core` until
the install has happened (render_hybrid.sh and render_info.sh do install on
first run). Pass the config paths as absolute paths: every render script does
`cd` into `engine/` first, so relative config paths break. Output paths too:
pass them absolute, or ffmpeg fails to open the destination.

The typography timeline is the same in both builds: hook top-left, three
points landing on the rail, stat on a white card, navy sweep, end card. Every
glyph is real typography rendered by Framer Motion in headless Chromium and
captured deterministically, so no lettering is ever AI-painted.

The pure vector build (`render_info.sh`) takes a `"scene"` key in the config:
`engine` (monitor over engine bay) or `choice` (three cases revealing
different mechanisms). It is the fallback when a generation is bad, and new
scenes get added behind the `SCENE_KEY` dispatch in `app_info.jsx` as needed.

Note on the stat screen: the `stat.post` line animates in word by word, so a
mid-animation frame can look truncated. Check a frame at 17.3s or later before
concluding the line overflowed.

`render_card.sh`, `render_image.sh` and `render.sh` are all superseded for the
daily post but still work. Kept for reference. Do not use them for the daily
run.

**Publisher** — n8n workflow `QkD45M0Zd1J7Seor`, "Kaizen — WP + GMB Publisher
(Cowork)", published. WordPress and Google Business Profile live here because
the session cannot reach either host directly. Drive it with the n8n MCP tool
`execute_workflow`, passing `inputs: { type: 'webhook', webhookData: { body:
{ ... } } }`. Do not try to call the webhook over HTTP; n8n cloud is
unreachable from the session.

Request body:

```
title, slug, contentHtml, summary, imageUrl, imageFilename,
imageExtension, imageMime, imageTitle, imageSlug, imageAlt,
imageDescription, skipGoogleBusiness
```

`imageUrl` is the raw.githubusercontent URL of the **3:2 cover**. Response:
`{ ok, postId, postUrl, mediaId, mediaUrl, googleBusiness }`. The Google
Business step is set to continue on error, so a GMB failure will not lose the
blog post; check the `googleBusiness` field and report it.

**Social publishing** — Zernio MCP. Accounts: Instagram
`69f3414b985e734bf3e0697a`, LinkedIn `69f34174985e734bf3e06b70`, TikTok
`69f34133985e734bf3e06870`, X `69fb9f1792b3d8e85f83c510`. Always pass
`account_id` explicitly. `posts_create` takes `media_urls` as comma-separated
public URLs, so the asset URLs go straight in with no upload step.

X gets the 4:5 cover as its image. For the covers on video posts the simple
`posts_create` MCP tool has no field, so use `call_tool` with the raw
`posts_create_post`: TikTok takes `tiktok_settings.video_cover_image_url`
(sent alongside `privacy_level: 'PUBLIC_TO_EVERYONE'`, `allow_comment: true`,
`content_preview_confirmed: true`, `express_consent_given: true`). Instagram's
reel cover field is `platformSpecificData.instagramThumbnail` on the instagram
platform entry (a URL, JPEG/PNG; verified live 2026-08-04).

**Booking link** — `https://calendly.com/prad-kaizenaiconsulting/new-meeting`.
Note that caption links are not tappable on organic Instagram and TikTok, so
those captions should point at the bio.

## The daily sequence

0. Verify push access with `git push --dry-run origin main` before spending
   any credits. If it fails, stop and tell Prad.
1. If `PENDING-PUBLISH.md` exists and describes approved content that has not
   gone live, clear that first. Rebuild and present it for approval in the
   current session before drafting anything new. The approval recorded in that
   file is a historical record, not live consent.
2. Before pulling from the queue, spend one web search checking whether
   something more timely is worth leading with instead: a genuine AI or
   small-business story breaking in the last 24 to 48 hours (a major product
   launch, a regulatory change, a fresh UK-relevant stat or report) that is
   clearly stronger than whatever sits next in the queue. Sense-check it
   against the Run log below so the same ground isn't covered twice. If
   something clearly beats the queue, write it up as today's topic instead of
   the next Pending row. It does not need a queue row: the Google Sheet
   connector can only update Status on an existing row, not insert a new one,
   so a dynamic topic is tracked in the Run log at the end of the day, same as
   every other run, and the queue's next Pending row stays untouched for a
   future day rather than being consumed or marked Complete. If nothing
   clearly beats it, read the topic queue and take the first Pending row as
   before.

   **Generate a topic every day (standing instruction from 2026-09-06).** The
   queue ran dry that day, every one of its 190-odd rows Complete and the
   Sheet connector has no way to insert new rows, so a bare "stop, the queue
   is empty" is no longer the right default. When there is no Pending row,
   do not stop: research the day's AI and small-business landscape (the same
   web search as the timeliness check above, widened if nothing jumps out)
   and pick the strongest angle for the day, sourced and current, in Kaizen's
   niche (UK small business, trades, AI tools and platforms). Sense-check it
   against the Run log so it does not retread ground already covered. Treat
   it exactly like a dynamic topic: no Sheet row, logged in the Run log at
   the end of the day. Only stop and tell Prad if a genuine blocker shows up
   (push access down, no web access, nothing sourceable at all), never merely
   because the queue itself is empty.
3. Research the topic on the web. Prefer UK sources, current figures, and
   anything that gives a concrete number worth building the video around.
4. Write the blog post: 900 to 1,400 words of HTML, British spelling, a clear
   H2 structure, **and external links to the sources in the body** (2 to 4
   reputable links, required). The publisher appends the Elementor booking
   button itself, so do not add a CTA button to the HTML. Write a 40 to 60
   word summary for Google Business.
5. Write per-platform copy. LinkedIn gets the long analytical version.
   Instagram gets the hook-first version with hashtags. TikTok gets the short
   punchy one. X gets the single sharpest sentence plus the link, and has to
   fit 280 characters, which is tighter than it looks. Run every caption
   through `validate_post_length` before presenting it. The LinkedIn and X
   captions carry both links: the blog article and the Calendly booking link.
6. Write the day's image description (topic-specific scene, no text) and
   generate the 3:2, 4:5 and 9:16 illustrations via workflow
   `FqYH4E3KZywda1ON`. Composite the covers with `render_cover.sh` and push
   all three images.
7. Animate the 9:16 illustration, fetch the clip back via workflow
   `T89V0h08JMpWkCE5`, build the video with `render_hybrid.sh`, QC frames, and
   push the MP4 to `video/YYYY-MM-DD-slug.mp4`. Fall back to `render_info.sh`
   + scene only if the generation is unusable twice.
8. Present everything to Prad as drafts: the blog post, the captions, the
   video and both covers. Wait for approval.
9. On approval, run the n8n publisher (3:2 cover as `imageUrl`), then create
   the Zernio posts (video via the version-less jsDelivr URL, X with the 4:5
   cover, reel/TikTok covers per the social publishing notes), then verify
   each post with `posts_get` after a minute (and after any 409, check
   `posts_list` before retrying), and only then set the Sheet row to Complete
   via the sheet updater workflow. Note: `posts_get` can fail response
   validation when a platform returns an empty `platformPostUrl` (TikTok does
   this routinely); that is not a publish failure. Use `call_tool` with
   `posts_get_post` to read the raw status.
10. Append a one-line record of the run to the Run log at the bottom of this
    file, commit it, and push.

## Voice and brand rules

These come from Prad directly and are not negotiable.

**No em dashes anywhere.** Use commas, full stops or brackets instead. This
applies to the blog post and every caption.

First person plural. Kaizen has built these things, so write "we built",
not "businesses can build". Concrete numbers beat adjectives. Name the
uncomfortable statistic rather than only the upside, because pointing at the
risk is what makes the advice credible.

No income or earnings promises. Cost claims always describe tool costs, never
what Kaizen charges. UK compliance matters more than a punchier line.

Visual brand: navy `#0A1628`, electric blue `#2E7CF6`, teal `#34D3A6`, alert
red `#FF5A5F`, light paper `#EAF0F9` for the infographic. Space Grotesk for
headlines, Inter for supporting copy. Where type sits over imagery, shadows hug
the glyphs only. Prad rejected block-wide scrims behind text, so never
reintroduce them. Over footage the tone per text block is chosen
automatically from the pixels behind it (navy on light, white on dark).

The daily video is the hybrid build: the day's illustration animated by
image-to-video, in the same flat vector style, under the animated typography,
with the stat and end card on flat paper. Prad rejected a motion-graphics
treatment on an abstract gradient and a cinematic b-roll treatment; the hybrid
is neither, it is the illustration itself moving. Every word on screen is real
typography, never AI-generated lettering, because AI lettering is what produced
the distorted text in the old image posts. The generated footage must contain
no text for the same reason. On 2026-08-05 Prad rejected the vector fallback
when the hybrid was infrastructure-blocked rather than generation-blocked:
treat the fallback as a last resort for bad generations only.

The daily stills are Gemini-generated flat-vector illustrations, different
every day and matched to the topic, with the typography composited on top by
`render_cover.sh`. The generated image itself must contain no text at all;
every word is real type added after generation. Blog and Google Business get
the 3:2, X and the Instagram/TikTok covers get the 4:5.

**The daily video was silent until 2026-09-06.** Feeds autoplay muted and the
captions carried the argument. The in-house `musicgen_daily.py` bed still exists
behind `MUSIC=1` for a one-off, but the daily post does not use it. Licensed and
AI-generated music tracks were tried repeatedly and always sounded wrong once cut
to length, so do not reach for those again. Superseded in part by the presenter
direction below: presenter segments carry real speech. The vector sections stay
silent, and every argument must still survive with the sound off, so on-screen
typography carries the point even when a voice is present.

## Content direction (set by Prad, 2026-09-06)

This supersedes the trades-led framing used up to 2026-09-05.

**Audience: general small business.** Write for owners of small businesses of
any kind, not specifically trades. Trades are welcome as an example, never the
frame. The useful question every day is "what tool or move can a small business
use to grow?" rather than "what is happening in the industry?".

**Lead with a hook.** Open on a line that earns the next three seconds: "If you
run a small business, you need to see this", "AI just changed the game for small
business", "Do this and your business grows". Then pay it off with something
genuinely trending. The hook is the first thing on screen and the first line of
every caption. It must be a real claim the piece actually supports, never bait.

**Mix the styles.** Two builds are now in rotation and a day can use either or
both:

- *Presenter (UGC) segment* — Prad on camera, talking to the reader, voiced.
  Realistic look, generated with `seedance_2_5`, `mode: 'omni_reference'`,
  `generate_audio: true`, `aspect_ratio: '9:16'`. Google VEO is not available on
  the Higgsfield connector (checked 2026-09-06, no catalogue match), so Seedance
  2.5 is the realistic-look model.
- *Vector explainer* — the existing `render_hybrid.sh` build, silent, carrying
  the stat card and end card.

The default shape is presenter hook first, vector payoff second.

**The presenter character.** The presenter is a fully generated character, not
Prad and not any other real person. Prad first supplied his own photo on
2026-09-06 and then asked for the presenter to look like someone else, so the
character was generated from scratch with `soul_2` and no photographic
reference of any real individual. Prad's own reference
(`331c3e04-d30d-4a9e-8202-063aaf95a0cb`) is retired and must not be used.

Prad asked on 2026-09-06 for the presenter to match his own demographic
without being his face, so the character is generated from a text description
of that demographic and never from his photo. The locked presenter reference
is Higgsfield job `aeefcda8-22ee-43bc-925e-63f23324edb7`. Pass that id as the
`image_references` media on every presenter clip so the face stays consistent;
never regenerate a new likeness, because the identity cannot be recovered once
lost. The written description is the continuity contract, so keep it verbatim:

> British South Asian man in his early thirties, neat short black hair, short
> stubble, plain smart navy button-down shirt, home office with a plain pale
> wall and a bookshelf partly in frame, natural British English accent.

**Realism beats polish, and this took three attempts to learn.** The workflow's
`references/ugc-character.md` mandates a "Beauty Floor" of model-tier looks;
following it produced a glossy stock-model character that Prad rejected as
fake. Its own User Override Rule says user-specified detail wins over its
defaults, so override the beauty floor deliberately. What worked: prompt for a
"candid smartphone snapshot" of an "ordinary" person "rather than a model",
ask for natural skin with visible pores, slight uneven tone and a blemish or
two, mild facial asymmetry, flat ordinary indoor daylight with no studio or
rim light, mild sensor noise, and rule out beauty filter, smoothing,
airbrushing, HDR, bokeh and cinematic grade. Do not overshoot the other way
either: a first attempt at "ordinary" returned someone who looked exhausted
and unkempt in a t-shirt, which is not credible as a business presenter. The
balance is a real person who tidied themselves up to film, alert and warm,
presentable but not glamorous.

If the character ever needs replacing, generate a new one with `soul_2` at
`3:4` and `2k` using that realism recipe, then record the new job id and
description here.

Two hard limits on presenter content, both of which the UGC workflow's own
safety gate also enforces:

- The presenter is a host giving advice, never a customer giving a testimonial.
  Do not script invented purchases, results, before-and-afters, or lived
  experience. First-person experience is only allowed when Prad supplies the
  words himself and confirms they are true.
- No income or earnings promises, same as every other channel.

**Costs changed with this direction.** `seedance_2_5` at 9:16 with audio costs
about 65 credits for 10s at 720p, 135 for 15s at 1080p, against roughly 15 for a
`kling3_0_turbo` vector clip. Budget accordingly and tell Prad when the balance
gets low.

**Fetching presenter clips.** A 15s 1080p Seedance clip is too large to come
back through the `T89V0h08JMpWkCE5` media-fetch workflow: the MCP session expires
mid-transfer (hit twice on 2026-09-06). Generate presenter clips at **720p**,
which lands in the size range that bridge handles reliably and costs half as
much. The session still cannot reach the Higgsfield CDN directly.

## Business details

Kaizen AI Consulting, 85 Great Portland Street, London. Phone 020 3432 0345,
info@kaizenaiconsulting.com, kaizenaiconsulting.com. UK AI consultancy working
with founders, small businesses and trades on AI builds and automations.
Standing offers: a free 30 minute strategy call, and a free 30 minute AI audit
for the automations audience.

## Known constraints

The session can reach GitHub, npm, PyPI and the open web. It cannot reach
kaizenaiconsulting.com, n8n cloud, calendly.com, jsDelivr, the Higgsfield CDN,
the Higgsfield upload host or the Zernio upload host. Note that Zernio's own
servers can reach jsDelivr even though the session cannot, which is why the
video URL works. Every design decision above follows from these limits. MCP
connector traffic routes through Anthropic's servers rather than the session
network, so the n8n, Zernio, Google Drive and Higgsfield connectors work
regardless of the environment's allowlist. `WebFetch` on arbitrary article
URLs is blocked by the egress proxy even though plain web search works; use
`WebSearch` for research and accept its synthesized snippets with citations
rather than trying to fetch the source pages directly.

The Claude Code routine's container does not ship `ffmpeg`, `ffprobe` or
ImageMagick's `convert` by default, all of which the render engine needs.
`apt-get install ffmpeg` can fail on unrelated broken mirror packages (run
`apt-get update` first, which usually fixes it); if it still fails, `pip3
install imageio-ffmpeg` gets a static ffmpeg binary
(`python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`)
that can be symlinked to `/usr/local/bin/ffmpeg`. `pick_text_style.py` needs
real `ffprobe` far less than it needs `convert` (ImageMagick); `apt-get
install imagemagick` after `apt-get update` is the reliable path. Check for
all three with `which` at the start of the render steps so this is not
rediscovered mid-run.

Media the session cannot fetch directly (Gemini images, Higgsfield clips)
comes in through n8n as base64: the image generator returns its own output,
and the media fetch workflow `T89V0h08JMpWkCE5` downloads any public URL and
hands it over.

## Run log

- 2026-07-28 — pipeline built. Engine, publisher workflow and scheduled task
  in place. Old n8n workflow `FqST9Ii9A9JWEOGB` retired.
- 2026-07-28 — dry run, sheet row 290. Draft stage completed end to end; held
  at approval. Two fixes came out of it: jsDelivr for video URLs, and the
  end-card tagline now auto-fits.
- 2026-07-29 — video reworked twice after Prad rejected first a
  motion-graphics-only treatment and then a cinematic b-roll treatment. Built
  `engine/src/app_info.jsx` and `engine/render_info.sh`, the animated flat
  vector infographic build.
- 2026-07-30 — stills and audio corrected. Built `engine/src/app_card.jsx` and
  `engine/render_card.sh`. `render_info.sh` now encodes silent by default.
- 2026-07-31 — first live run, sheet row 290, "Microsoft's In-House AI Models:
  What MAI-Code-1-Flash Means for Copilot Users". Blog post 6784, Google
  Business post, X `6a6c516b379ef89664583f3f`, LinkedIn
  `6a6c6c5d50e85d6c5e5f6ace`, Instagram `6a6c8d64cd0acf155495a508`, TikTok
  `6a6c8d6d9cdd624ce47af138`. Three findings baked into this runbook: the `@`
  in jsDelivr URLs breaks platform fetchers, `posts_create` 409s can be false
  and still publish, and always verify after publishing. Row 290 Complete.
- 2026-08-01 — second live run, sheet row 291, "Claude for Small Business:
  Ready-to-Run AI Workflows for Owners Who Don't Code". Clean run. Blog post
  6787, LinkedIn `6a6da87e76437f2b7a0daa13`, Instagram
  `6a6da88c76437f2b7a0dae1d`, TikTok `6a6da89072779ff6690f053a`, X
  `6a6da89672779ff6690f0612`. Row 291 Complete.
- 2026-08-02 — third live run, sheet row 292, "Google Gemini Spark". Blog post
  6790, LinkedIn `6a6f0fbb5e4c84a1c92b9c5b`, Instagram
  `6a6f0fedb3812118567386f4`, TikTok `6a6f0ff7ee008aabcf322ba6`, X
  `6a6f1000b3812118567389ac`. One false 409, no duplicate. Row 292 Complete.
- 2026-08-03 — fourth live run, sheet row 293, "Zapier vs Make vs N8N in 2026".
  Blog post 6793, LinkedIn `6a704dc2ba9ce5bdce177670`, Instagram
  `6a704de3e473b5525143d94d`, TikTok `6a704de8e473b5525143da43`, X
  `6a704dede473b5525143db00`. Row 293 Complete.
- 2026-08-03 (evening) — pipeline upgraded: Gemini illustrations with
  composited typography, 3:2 blog cover, 4:5 for X and reel covers, required
  source links, scene-varied vector engine.
- 2026-08-03 (late) — video upgraded to the hybrid build. Higgsfield i2v,
  media fetch workflow `T89V0h08JMpWkCE5`, `render_hybrid.sh` and
  `pick_text_style.py`.
- 2026-08-04 — fifth live run, sheet row 294, "Why 40% of AI Agent Projects
  Fail". First live hybrid + Gemini-cover run. Blog post 6796, LinkedIn
  `6a719b8cb39aa446e4e84916`, Instagram `6a719ba895845992bf3aa3c0`, TikTok
  `6a719bb2f24fd2c0020dfe74`, X `6a719be069251eadec0c4a94`. Instagram reel
  cover and TikTok cover both verified working. Row 294 Complete.
- 2026-08-05 to 2026-08-08 — four days blocked. The pipeline was running as a
  Cowork scheduled task, which cannot have a repository attached, so the git
  proxy refused every push with "not in this session's authorized repository
  set". Nothing published on 5, 6, 7 or 8 August. The approved Canva AI 2.0
  content is held in `PENDING-PUBLISH.md`. Resolved on 2026-08-08 by moving
  the pipeline to a Claude Code routine with this repository attached, and by
  moving this runbook out of the Claude project and into the repository so the
  routine session can read it. Lesson recorded as step 0 of the daily
  sequence: check push access before spending credits.
- 2026-08-09 — cleared the blocked backlog, sheet row 295, "Canva AI 2.0: The
  Biggest Canva Change in a Decade and What It Means for Your Marketing".
  Push access verified working first. Rebuilt all assets from the durable
  sources in `PENDING-PUBLISH.md`; the 9:16 illustration needed three
  regenerations to leave the rail enough clearance, and Prad asked for the
  `labelFontSize` config fallback (see the render engine section) so that
  does not take as long again. Blog post 6800, Google Business post,
  LinkedIn `6a78f2152b1c759cef3b1cce`, Instagram `6a78f27d9c10bde49d381e65`,
  TikTok `6a78f289a617b08ccfb42bfd`, X `6a78f2b59c10bde49d382f1c`. Three
  false 409s on LinkedIn, Instagram and TikTok, all confirmed actually
  published per the known false-409 behaviour. `PENDING-PUBLISH.md` deleted.
  Row 295 Complete. No new topic drafted today; the backlog took the full
  session.
- 2026-08-10 — sixth live run, sheet row 296, "Cursor 3.9 Automations:
  Turning Vibe Coding Into Always-On Business Agents". Draft stage flagged a
  real layout bug: the still cover's top-left headline and a video point
  label were both overlapping the illustration. Fixed at the engine level
  rather than per-day: `render_cover.sh` and `app_info.jsx` now put the
  kicker/headline and the point-label column on the right, right-aligned,
  with illustrations generated subject-left instead. Also fixed two
  illustration-generation regressions hit while iterating: a vertical
  background seam where the "confined" and "clear" zones met (fixed by
  describing one flat canvas with a vignette added on top, not two zones in
  the prompt), and the model overshooting the requested left-confinement
  percentage by ~20 points (now generate a tight ask and verify with actual
  pixel measurement before animating). Also dropped the "gentlest push in"
  camera instruction for hybrid video generation: the slow zoom drifted the
  frame enough over 10 seconds to walk the subject into the text column by
  mid-clip; camera is locked static now. Cost about 45 Higgsfield credits
  across five image regenerations and two video regenerations to land the
  fix; balance finished at 8.69, below the ~35 floor, flagged to Prad.
  Blog post 6803, Google Business post, LinkedIn `6a7a482da05f4d65770459ff`,
  Instagram `6a7a4876b6494c5ddf38bf28`, TikTok `6a7a488079e68e76a8f511c7`,
  X `6a7a48b479e68e76a8f51d43`. Two false 409s, LinkedIn and TikTok, both
  confirmed actually published per the known false-409 behaviour. Row 296
  Complete.
- 2026-08-14 — seventh live run, sheet row 298, "Lovable 2.0 for Small Teams:
  What the Latest Update Actually Lets You Build". Found an orphaned
  2026-08-13 draft (covers and a static-fallback hybrid video, built under
  the credit-blocked fallback) that had been rendered and pushed to main but
  never logged, never published, and never recorded in `PENDING-PUBLISH.md`.
  Confirmed via Zernio that nothing had gone live, reused the existing
  covers, and rewrote the blog post and captions from scratch since the
  original text was not persisted anywhere. Presented the draft for approval
  before touching the publish stage, per the same live-consent rule that
  applies to `PENDING-PUBLISH.md`. Once Higgsfield balance had recovered to
  508 credits, replaced the static-stills fallback with a real
  `kling3_0_turbo` animation (camera locked static per the 2026-08-10 fix)
  before publishing, pushed as `-r2` to avoid touching the original filename.
  Blog post 6806, Google Business post, LinkedIn `6a7ecbd0ef1f05c31ea059a9`,
  Instagram `6a7ecbf48a69875cd455e62e`, TikTok `6a7ecbf8e959c796b1076979`,
  X `6a7ecbf08a69875cd455e49e`. Two false 409s, LinkedIn and TikTok, both
  confirmed actually published per the known false-409 behaviour. Row 298
  Complete.
- 2026-08-18 — eighth live run, sheet row 298, "Sora Is Gone: What the AI
  Video Shake-Up Means for Small Business Marketing in 2026". Found a second
  orphaned draft on the same topic from 2026-08-15/16 (covers, a 9:16 base
  illustration, and two video iterations) that had been rendered and pushed
  to main but never logged, published, or recorded in `PENDING-PUBLISH.md`,
  same pattern as the 8/13 incident. Confirmed via Zernio (`posts_list`,
  nothing published) and the sheet (row still Pending) that nothing had gone
  live, then reused the existing 08-15 covers and 9:16 illustration rather
  than regenerating art. Did not reuse the 08-16 video: its stat card claimed
  Sora cost "$15M a day", a figure that could not be sourced cleanly, so
  `engine/config.json` was corrected to the $1M/day net burn rate reported by
  the WSJ and TechXplore (matching $2.1M total lifetime revenue and the
  <500K user figure), and the animation was rebuilt with `kling3_0_turbo`
  from the existing illustration. Blog post, captions and summary were
  written fresh this run using the corrected figure throughout, then
  presented for approval before touching the publish stage. `ffmpeg`,
  `ffprobe` and `imagemagick` needed reinstalling on this container; also hit
  a persistent `SignatureDoesNotMatch` on Higgsfield's `media_import_url` for
  the 9:16 illustration (three attempts, not transient), worked around by
  routing a heavily downsized copy through `media_upload` + the generic PUT
  workflow `BsFqwIIUIQbtn735` + `media_confirm` instead. Blog post 6809,
  https://kaizenaiconsulting.com/sora-shutdown-ai-video-small-business-marketing/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a840d2273ed1df9a0322ce5`, Instagram `6a840d4890b5768b3760377e`, TikTok
  `6a840d4c90b5768b3760387b`, X `6a840d43d18501cd6dd1500a`. Two false 409s,
  LinkedIn and TikTok, both confirmed actually published per the known
  false-409 behaviour; TikTok's `platformPostUrl` also came back empty on
  `posts_get`, which is the known non-failure case. Row 298 Complete.
- 2026-08-19 — ninth live run, sheet row 299, "Google Gemini Omni: How to
  Make and Edit Marketing Videos Just by Talking". Found a third orphaned
  draft (covers, 9:16 illustration, and a static-fallback video, all dated
  2026-08-15) rendered and pushed to main but never logged or published,
  same pattern as 8/13 and 8/15-16. Confirmed via Zernio (`posts_list`,
  nothing published) and the sheet (row still Pending) that nothing had
  gone live, reused the existing covers and 9:16 illustration, and rewrote
  the blog post and captions from scratch. Caught a bad stat in the
  orphaned draft's video: the stat card claimed "58% of UK firms use AI",
  which did not match any sourced figure; corrected to 54%, the BCC/Atos
  2026 figure, in `engine/config.json` before rebuilding. Attempted a real
  `kling3_0_turbo` animation since Higgsfield balance was healthy (433
  credits): `media_import_url` hit the same persistent
  `SignatureDoesNotMatch` from 8/18 (confirmed non-transient again), and
  the `media_upload` + PUT workaround got the image uploaded but
  `media_confirm` then failed three times running ("Something went wrong",
  no further detail). Fell back to the static-clip build per the runbook's
  2a fallback rather than keep burning attempts; QC passed cleanly. Blog
  post 6812, https://kaizenaiconsulting.com/gemini-omni-video-editing/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a855d17deea8e545e6e0e9a`, Instagram `6a855d3b0b2c2a2e424e7de3`, TikTok
  `6a855d3ea1d94c25288f901c`, X `6a855d370b2c2a2e424e7cf5`. One false 409
  on LinkedIn, confirmed actually published per the known false-409
  behaviour; TikTok's `platformPostUrl` also came back empty on
  `posts_get`, the known non-failure case, confirmed published via the raw
  `posts_get_post` status field instead. Row 299 Complete.
- 2026-08-20 — tenth live run, sheet row 300, "Is Higgsfield Reliable Enough
  for Your Business? The New Production Stack Reviewed." First run to review
  Higgsfield itself, written from the pipeline's own experience: hit a real
  `SignatureDoesNotMatch` on `media_import_url` and a `media_confirm` failure
  streak on 18/19 August, both already in this log. Push access verified
  first; `ffmpeg`, `ffprobe` and `imagemagick` needed reinstalling on this
  container. Illustration prompt used the post-08-10 subject-left,
  clear-right convention throughout (3:2, 4:5, 9:16); the first 9:16 came
  back with a visible top/middle/bottom seam, the same failure mode as
  2026-08-04, fixed in one regeneration with stronger uniform-background
  wording. Balance was healthy (433 credits) so a real `kling3_0_turbo`
  animation ran; the first `generate_video` call was submitted without a
  `medias` array by mistake (a plain text-to-video job with no reference
  image), caught immediately via `job_status` before wasting the render, and
  resubmitted correctly. Generation itself took close to 6 minutes, well
  above the documented 60-180s range, but completed cleanly with no other
  issues. QC passed on the first render, no fallback needed. Blog post 6815,
  https://kaizenaiconsulting.com/higgsfield-reliability-review/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a86b4d49e62dad398e87500`, X `6a86b4ea31436be3d6d86892`, Instagram
  `6a86b50b7c3744eb8f595441`, all confirmed published clean, no false 409s.
  TikTok failed twice (initial attempt plus one retry) with "Daily active
  user quota reached," a platform-side cap on the connected TikTok app, not
  a content or credential problem; post `6a86b50f31436be3d6d86b86` is left
  in `failed` state in Zernio for a manual `posts_retry` once the quota
  resets. Row 300 was still set to Complete rather than left Pending,
  because five of six destinations were confirmed live and leaving the row
  Pending would have queued this exact topic for a full re-draft on the next
  run, duplicating the blog post and three social posts already published
  (the failure mode hit on 2026-08-13, 08-15/16 and 08-18/19). Flagged to
  Prad as a partial completion needing a manual TikTok retry.
- 2026-08-21 — eleventh live run, sheet row 301, "Kling 3.0 vs Seedance 2.0:
  Cheaper, Audio-Native AI Video for UK Small Businesses." Push access
  verified first (a stale local `main` ref briefly looked like a
  non-fast-forward problem; a fresh `git fetch origin main` showed local
  HEAD and `origin/main` already matched, so it was a caching artefact, not
  a real access issue). `ffmpeg` and `imagemagick` needed reinstalling on
  this container. Illustration prompt used the subject-left,
  clear-right/clear-column convention; the first 9:16 generation left the
  hand and arm reaching too far into the right-hand label column, fixed in
  one regeneration with an explicit "confine the whole scene to the left
  35% of the frame" instruction. Higgsfield balance was healthy (403
  credits) so a real `kling3_0_turbo` animation ran cleanly on the first
  attempt, no `SignatureDoesNotMatch` this time. First hybrid render caught
  a genuine layout bug: two of the three point labels overlapped on screen
  because the label text wrapped to 4 lines each, taller than the fixed row
  spacing. Fixed by shortening the point text and dropping `labelFontSize`
  to 44 per the existing runbook fallback, then rebuilt from the same
  footage (no extra Higgsfield spend) and re-QC'd clean. Draft presented
  and approved by Prad in-session before any publish call. Blog post 6818,
  https://kaizenaiconsulting.com/kling-seedance-ai-video-uk-small-business/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a880060ef2054625e53a994`, X `6a88006dd056b371d3b591ee`, Instagram
  `6a8800790febbe6ad5e2f6cc`, all published clean with no false 409s.
  TikTok returned the known false 409 on `posts_create_post` but had
  actually been created (`6a88007dd056b371d3b596cb`, confirmed via
  `posts_list`); it then sat in `publishing` for close to 5 minutes,
  longer than any prior run, likely genuine TikTok-side video processing
  plus the server-side cover-image stitch, and confirmed published on
  a later poll rather than being retried. Row 301 Complete.
- 2026-08-22 — twelfth live run, sheet row 302, "68% of Google Searches Now
  End Without a Click: What UK Trades Should Do About It". Push access
  verified first (a stale local `main` ref was behind `origin/main`, same
  caching artefact as 2026-08-21, fixed with `git branch -f main
  origin/main`). `ffmpeg` and `imagemagick` needed reinstalling on this
  container. No `PENDING-PUBLISH.md` backlog to clear. Illustration used
  the subject-left, clear-right convention throughout (3:2, 4:5, 9:16): a
  UK tradesperson checking a glowing map-pin/star result on their phone
  outside a job. All three illustrations, both covers and the hybrid
  video QC'd clean on the first generation, no regenerations needed.
  Higgsfield balance was healthy (388 credits) so a real `kling3_0_turbo`
  animation ran; `media_import_url` worked cleanly this time, no
  `SignatureDoesNotMatch`. Draft presented and approved by Prad in-session
  before any publish call. Blog post 6821,
  https://kaizenaiconsulting.com/zero-click-search-uk-trades/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a894fa5847c49f94972fdad`, Instagram `6a894fb9407e16b5aa42c438`
  (reel confirmed at instagram.com/reel/DcVYLeTEVzS), X
  `6a894fee07d2bd4487538785`, all published clean. TikTok returned the
  known false 409 on `posts_create_post` but had actually been created
  (`6a894fc2847c49f94972fefc`), confirmed via `posts_list` and then via
  `posts_get_post` (status published, cover image applied, empty
  `platformPostUrl` the known non-failure case). Row 302 Complete.
- 2026-08-23 — thirteenth live run, sheet row 303, "Google AI Mode Passed 1
  Billion Users: Is Your Business Showing Up in It?". No `PENDING-PUBLISH.md`
  backlog to clear. Push access verified first via `git push --dry-run origin
  main`; `ffmpeg` and `imagemagick` needed reinstalling on this container.
  Illustration used the subject-left, clear-right convention throughout (3:2,
  4:5, 9:16): a UK small business owner checking a glowing AI chat interface
  on their phone. The first 9:16 generation came back with a visible
  contrasting panel/box behind the figure, the same background-seam failure
  mode as 2026-08-04 and 2026-08-20, fixed in one regeneration by explicitly
  ruling out any doorway, frame or panel and keeping the whole background one
  flat colour with no shading changes even behind the subject. 3:2 and 4:5
  covers needed no regeneration. Higgsfield balance was healthy (373.69
  credits) so a real `kling3_0_turbo` animation ran; `media_import_url`
  worked cleanly on the first attempt, no `SignatureDoesNotMatch`. Hybrid
  video QC'd clean on the first render, no fallback needed. Draft presented
  and approved by Prad in-session before any publish call. Blog post 6824,
  https://kaizenaiconsulting.com/google-ai-mode-visibility/, Google Business
  post (accepted, PROCESSING at submission), LinkedIn
  `6a8aa0c6ab277af01f8e634e`, X `6a8aa0d7641b2834abb64b85`, Instagram
  `6a8aa0ed641b2834abb650bf`, TikTok `6a8aa0f6ab277af01f8e6775`, all
  published clean with no false 409s this run. Row 303 Complete.
  Separately, this session's harness-level git branch policy defaulted to a
  feature branch (never push to a different branch without permission),
  which conflicts with this pipeline's requirement that every asset lands on
  `main` (jsDelivr and raw.githubusercontent both resolve from the default
  branch). Followed this runbook and pushed straight to `main` as every
  prior run has, all fast-forward merges, and flagged the conflict to Prad
  for future sessions.
- 2026-08-24 — fourteenth run. No fresh queue topic drafted; found a second
  orphaned draft (fourth time this pattern has hit: 08-13, 08-15/16, 08-19,
  now 08-23), a same-day second run on 2026-08-23 via the dynamic-topic step
  ("ChatGPT Ads Europe") that built and pushed full assets to `main` but was
  never logged or published. Confirmed via `posts_list` (published, draft,
  scheduled, failed) and the sheet that nothing had gone live, then cleared
  it per the backlog-first rule instead of drafting the next Pending row
  (confirmed as "Selling Inside ChatGPT: What Agentic Commerce Means for
  Small UK Retailers" for a future run). The original assets were written a
  day early and said the EU rollout "changes tomorrow" with a "10 weeks" UK
  head start; since this recovery run itself fell on the actual expansion
  date, corrected to present-tense copy and the precise ~11-week gap (6 June
  to 24 Aug) across both covers and the video. Re-fetched the original
  Higgsfield footage via `T89V0h08JMpWkCE5` and regenerated fresh 3:2/4:5
  Gemini illustrations rather than reusing the stale-copy ones, so no new
  Higgsfield credits were spent, only Gemini. Pushed corrected assets as
  `-r2`, originals left untouched. Draft presented and approved by Prad
  in-session before any publish call. Blog post 6827,
  https://kaizenaiconsulting.com/chatgpt-ads-europe-uk-head-start/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a8bf45e0a23f3bf451af642`, X `6a8bf46fe8e81a09eb22987b`, Instagram
  `6a8bf4730a23f3bf451af94e`, TikTok `6a8bf477ece2b4c42b46b3f7`. TikTok
  returned the known false 409 on `posts_create_post` but had actually been
  created, confirmed via `posts_list`. No sheet row updated since this was a
  dynamic topic outside the queue, consistent with the runbook's dynamic-
  topic handling.
- 2026-08-25 — fifteenth live run, sheet row 304, "Selling Inside ChatGPT:
  What Agentic Commerce Means for Small UK Retailers". No `PENDING-PUBLISH.md`
  backlog to clear. Push access verified first; `ffmpeg` and `imagemagick`
  needed reinstalling on this container. No fresher breaking story surfaced in
  the timeliness check, so took the next Pending row as normal. Both the 4:5
  and 9:16 illustrations came back on the first pass with the known top/bottom
  background seam (2026-08-04/08-20/08-23 failure mode); the 3:2 was clean.
  Fixed both in one regeneration each with stronger single-flat-colour wording
  ("zero gradient, zero banding, do not render two shades stacked
  vertically"). Higgsfield balance was healthy (343.69 credits) so a real
  `kling3_0_turbo` animation ran; `media_import_url` worked cleanly, no
  `SignatureDoesNotMatch`. Hybrid video QC'd clean on the first render across
  all checked frames (2.5s/6s/12.5s/15.5s/17.3s/17.6s/20s), no fallback
  needed. Draft presented and approved by Prad in-session before any publish
  call. This session's harness-level branch policy again defaulted to a
  feature branch (same conflict logged 2026-08-23); pushed straight to `main`
  as every prior run has, all fast-forward merges, then also pushed the
  feature branch itself to satisfy the harness's own unpushed-commit check.
  Blog post 6830, https://kaizenaiconsulting.com/chatgpt-agentic-commerce-uk-retailers/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a8d485c52f0d215f66ecdb5`, X `6a8d486952f0d215f66ed0c8`, both published
  clean with no false 409s. Instagram `6a8d4889eddd3dc78492b452` published
  clean. TikTok `6a8d488c05545ffd86bf476d` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list`; it then sat in `publishing` for several minutes (server-side
  cover-image stitch, same pattern as 2026-08-21) before confirming published.
  Row 304 Complete.
- 2026-08-26 — sixteenth live run, sheet row 305, "The Amazon v Perplexity
  Ruling: What the First Agentic Shopping Case Means for You". No
  `PENDING-PUBLISH.md` backlog to clear. Push access verified first (local
  `main` ref was stale again, same recurring caching artefact, fixed with
  `git branch -f main origin/main`). `ffmpeg` and `imagemagick` needed
  reinstalling on this container. Timeliness check found nothing fresher than
  the queued topic, so took the next Pending row as normal; the row number
  the sheet updater returned (305) did not match the row this session counted
  by hand from the sheet dump (306), an off-by-one in counting markdown table
  lines rather than a sheet problem — the updater matches by Topic text, so
  the correct row was set regardless. Illustration used the subject-left,
  clear-right convention throughout (3:2, 4:5, 9:16): a small business owner
  watching a friendly AI robot place items in a basket, with scales of
  justice nearby for the ruling. The 4:5 came back on the first pass with the
  known top/bottom background seam (2026-08-04/08-20/08-23/08-25 failure
  mode); fixed in one regeneration with stronger single-flat-colour wording.
  Higgsfield balance was healthy (328.69 credits) so a real `kling3_0_turbo`
  animation ran; `media_import_url` worked cleanly, no `SignatureDoesNotMatch`.
  Generation took close to 4 minutes. Hybrid video QC'd clean on the first
  render across all checked frames (2.5s/6s/12.5s/15.5s/17.3s/17.6s/20s), no
  fallback needed. This session's git identity, harness-level branch policy
  and unpushed-commit check were handled the same way as 2026-08-23/08-25:
  committed and pushed straight to `main` per this runbook, then synced and
  pushed the feature branch too. Draft presented and approved by Prad
  in-session before any publish call. Blog post 6833,
  https://kaizenaiconsulting.com/amazon-perplexity-ruling-ai-shopping-agents/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a8e98f7cf3df689083e459a`, X `6a8e9906cf3df689083e4a12`, both published
  clean with no false 409s. Instagram `6a8e9940ff7011f0668618eb` published
  clean. TikTok `6a8e994eff7011f066861dd6` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list`; it sat in `publishing` for a few minutes (server-side
  cover-image stitch, same pattern as prior runs) before confirming
  published. Row 305 Complete.
- 2026-08-28 — seventeenth live run, sheet row 306, "New UK Rules on AI
  Decisions Are Live: The Data (Use and Access) Act Explained for SMEs". No
  `PENDING-PUBLISH.md` backlog to clear. Push access verified first (local
  `main` was already in sync with `origin/main`, no stale-ref issue this
  run). `ffmpeg` and `imagemagick` needed reinstalling on this container.
  Timeliness check found nothing fresher than the queued topic, so took the
  next Pending row as normal. Illustration used the subject-left, clear-right
  convention throughout (3:2, 4:5, 9:16): a UK small business owner reviewing
  a printed decision report with a magnifying glass beside a tablet showing a
  paused AI icon and warning triangle. The first 9:16 generation came back
  with a broken face, a blank outline circle instead of the filled
  flat-shaded head used in the other two ratios, a new failure mode not
  previously logged; fixed in one regeneration with an explicit instruction
  against outline-only shapes. The first 4:5 generation had the known
  background seam; a first regeneration with stronger flat-colour wording
  alone was not enough (confirmed by sampling pixels either side of the
  seam), fixed on a second regeneration using the "single canvas with a
  vignette, not two zones" technique recorded from 2026-08-10. Higgsfield
  balance was healthy (313.69 credits) so a real `kling3_0_turbo` animation
  ran; `media_import_url` worked cleanly, no `SignatureDoesNotMatch`. First
  hybrid render caught a genuine layout bug: all three point labels
  overlapped and were unreadable at the 12.5s mark. Root cause traced to a
  mistaken `labelFontSize` increase: the runbook's render-engine section
  said the default was 54 and to "try 44" to shrink crowded labels, but the
  actual code default (`engine/src/app_info.jsx`, `LABEL_FONT`) is 40, so
  the 44 override made the text bigger and the overlap worse, not better.
  Fixed by removing the override and cutting point text to three or four
  words each so it wraps to at most two lines within the 168px row box (165px
  row gap), then rebuilt from the same footage at no extra Higgsfield spend;
  QC passed clean on the rebuild across all checked frames. Corrected the
  runbook's render-engine section with the true default and the row-box/
  row-gap math so this is not mis-fixed again. Draft presented and approved
  by Prad in-session before any publish call. Blog post 6836,
  https://kaizenaiconsulting.com/duaa-ai-decisions-sme-rules/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a913ccc0d8b1996ffcf42c0`, X `6a913cdc0d8b1996ffcf489e`, both published
  clean with no false 409s. Instagram `6a913ce72245fecf4cb52ff3` published
  clean. TikTok `6a913cf10d8b1996ffcf4e40` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list`. Row 306 Complete.
- 2026-08-29 — eighteenth live run, sheet row 307, "There's Still No UK AI
  Act: Here's the Regulation That Actually Applies to Your Business". No
  `PENDING-PUBLISH.md` backlog to clear. Push access failed on the first
  `git push --dry-run origin main` with a non-fast-forward rejection; a
  `git fetch origin main` showed local `main` two commits behind
  `origin/main`, the same stale-ref caching artefact logged on 2026-08-21/
  08-22/08-26, fixed with `git branch -f main origin/main`. `ffmpeg`,
  `ffprobe` and `imagemagick` were already present on this container, no
  reinstall needed. Timeliness check found nothing fresher than the queued
  topic, so took the next Pending row as normal. Illustration used the
  subject-left, clear-right convention throughout (3:2, 4:5, 9:16): a UK
  small business owner examining an open ledger with a magnifying glass
  beside a glowing circuit-pattern AI orb. All three illustrations, both
  covers and the hybrid video QC'd clean on the first generation and first
  render, no regenerations needed. Higgsfield balance was healthy (298.69
  credits) so a real `kling3_0_turbo` animation ran; `media_import_url`
  worked cleanly, no `SignatureDoesNotMatch`. Generation took a little over
  4 minutes. Draft presented and approved by Prad in-session before any
  publish call. Blog post 6839,
  https://kaizenaiconsulting.com/uk-ai-regulation-no-ai-act-what-applies/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a92903e68cedd96535573eb`, X `6a92904aa225b15929e36767`, Instagram
  `6a929061980343a2bf0a7f2d`, all published clean with no false 409s.
  TikTok `6a929065a19e30d32ed9207b` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list` and then via `posts_get`. Row 307 Complete.
- 2026-08-30 — nineteenth run, sheet row 308, "The EU AI Act Delay: What the
  Digital Omnibus Means for UK Firms Selling Into Europe". Push access
  verified first (same recurring stale-local-`main` caching artefact as
  2026-08-21/22/26/29, fixed with `git branch -f main origin/main`). No
  `PENDING-PUBLISH.md` backlog, no orphaned prior-day assets. `ffmpeg` and
  `imagemagick` needed reinstalling on this container. Timeliness check found
  nothing fresher than the queued topic. Illustration used the subject-left,
  clear-right convention throughout (3:2, 4:5, 9:16): a UK business owner
  examining a stamped compliance document beside a paused hourglass, with
  shipping crates and a cargo ship visible through a window. The first 9:16
  generation had the known top/bottom/top background seam (recurring since
  2026-08-04), confirmed by pixel sampling and fixed in one regeneration with
  the "one continuous sheet of paper" single-canvas wording. Higgsfield
  balance was healthy (283.69 credits) so a real `kling3_0_turbo` animation
  ran; `media_import_url` worked cleanly, no `SignatureDoesNotMatch`. Hybrid
  video QC'd clean on the first render across all checked frames. Full draft
  (blog post, captions, both covers, video) built, pushed to `main`, and
  presented for approval in-session. **Prad then asked to skip this topic
  instead of publishing it and move straight to the next one.** Sheet row 308
  was set to Complete via the sheet updater per that explicit instruction,
  without any publish step run: no WordPress/Google Business post, no Zernio
  posts, for this topic. The covers, 9:16 illustration and hybrid video for
  this topic remain committed on `main` at `image/2026-08-30-eu-ai-act-delay-
  {3x2,4x5,9x16}.jpg` and `video/2026-08-30-eu-ai-act-delay.mp4`, built but
  intentionally never published. Noting this explicitly so a future run does
  not mistake these for an orphaned draft in the pattern hit repeatedly on
  2026-08-13, 08-15/16, 08-19 and 08-23/24: this one was seen and deliberately
  skipped, not missed.
- 2026-08-31 — twentieth run. Push access verified first (local `main` was
  badly stale, well behind `origin/main`; fixed with `git fetch origin main`
  and `git branch -f main origin/main`). `ffmpeg` and `imagemagick` needed
  reinstalling on this container. Found a new instance of the orphaned-draft
  pattern (previously hit 08-13, 08-15/16, 08-19, 08-23/24): after the
  2026-08-30 EU AI Act Delay topic was logged as skipped, the same session
  went on to build two more full asset sets ("BigChange Lightning/Cooper AI
  launch" and "OpenAI Astra math breakthrough," both covers + 9:16 + hybrid
  video) that were pushed to `main` but never logged, never presented, and
  never published, the first time two orphaned topics landed in one day.
  Confirmed via `posts_list` that neither had gone live, then rebuilt text
  for both from scratch and presented both drafts for approval before
  touching the topic queue, per the backlog-first rule; no new topic drafted,
  consistent with the 2026-08-09 precedent. QC on the pre-built videos
  surfaced a real accuracy question: their stat cards carried specific claims
  ("fix rate 75% to 90%," "renewal price up 25%, up from a 15% launch rate,"
  "reviews so far: mixed," "verified by a Fields Medalist," "same lab was
  wrong before") that had not been sourced in this session. Verified all of
  them against fresh web search rather than trusting or discarding them
  blind: every one checked out, and the OpenAI search surfaced a materially
  important fact the original blog draft had missed entirely, that the
  August 2026 Astra release has already drawn research-misconduct allegations
  from mathematicians (an uncredited-reuse claim from a Yeshiva University
  professor) on top of a genuine prior incident (an October 2025 false GPT-5
  Erdős-problem claim that OpenAI retracted). Rewrote both blog posts and all
  captions to lead with the better-sourced numbers and fold in that
  credibility caveat, replacing weaker or unsupported figures used in the
  first draft pass. Both drafts approved by Prad in-session, with an explicit
  instruction to publish both, staggered six hours apart, in either order.
  Zernio's `posts_create`/`posts_create_post` support native per-post
  scheduling (`schedule_minutes` / `scheduled_for`), which is robust
  regardless of session lifetime; the WP + GMB publisher workflow has no
  scheduling field and publishes immediately on call, and a session-side
  multi-hour delay was judged unreliable in this environment given container
  reclaim on inactivity. Published BigChange/Cooper's blog, Google Business
  post and all four social posts immediately; published OpenAI Astra's blog
  and Google Business post immediately too (no reliable way to delay those)
  but scheduled all four of its social posts for 2026-08-31 14:03 UTC, six
  hours out. Flagged this asymmetry to Prad. BigChange/Cooper: blog post
  6842, https://kaizenaiconsulting.com/bigchange-cooper-ai-cost/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a9534bc85d057650eef5f80`, X `6a9534ce743d63692081ca03`, Instagram
  `6a9534e9e137981c80476948`, all published clean with no false 409s. TikTok
  `6a9534f61845afb2403f8691` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list`. OpenAI Astra: blog post 6845,
  https://kaizenaiconsulting.com/openai-astra-math-breakthroughs/, Google
  Business post (accepted, PROCESSING at submission), LinkedIn
  `6a95355e22b2a41418ab8b76`, X `6a95356390f12d116af2271b`, Instagram
  `6a95356c5eb6762c9b4dd114`, TikTok `6a95356f90f12d116af22b0e`, all
  scheduled cleanly for 14:03 UTC. No sheet row updated for either topic,
  both dynamic/backlog topics outside the queue, consistent with prior
  dynamic-topic handling. The queue's next Pending row remains untouched for
  a future run.
- 2026-09-01 — twenty-first live run, sheet row 310, "Checkatrade's Free
  TradeMore App: Free AI Job Management for Every UK Tradesperson". No
  `PENDING-PUBLISH.md` backlog, but a related bookkeeping issue turned up: the
  queue's first Pending row (309, "BigChange Lightning and Cooper") was still
  marked Pending even though that exact content was already researched,
  drafted and published the previous day (2026-08-31) as a dynamic/backlog
  topic. Set that row to Complete via the sheet updater before drafting
  anything, to avoid duplicating a post that had already gone live, then took
  the following Pending row (310) as today's topic. Push access verified
  first; `ffmpeg`, `ffprobe` and `imagemagick` needed reinstalling on this
  container. Timeliness check (DeepSeek funding, an Anthropic account
  security incident, an OpenAI internal-agent reward-hacking report,
  California AI legislation, a ransomware group's misuse of Cursor Agent)
  found nothing clearly stronger than the queue topic for a UK small-business
  audience, so proceeded with the queue as normal. Illustration used the
  subject-left, clear-right convention throughout (3:2, 4:5, 9:16): a UK
  electrician beside his van and toolbox, checking a phone showing a chat
  bubble and quote/invoice icon. All three illustrations, both covers and the
  hybrid video QC'd clean on the first generation and first render, no
  regenerations needed. Higgsfield balance was healthy (238.69 credits) so a
  real `kling3_0_turbo` animation ran; `media_import_url` worked cleanly, no
  `SignatureDoesNotMatch`. Draft presented and approved by Prad in-session
  before any publish call. Blog post 6848,
  https://kaizenaiconsulting.com/checkatrade-trademore-free-ai-job-management/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a96828b6306791a13042a8a`, X `6a968299a7daed7813907cb3`, Instagram
  `6a9682c0d5e1aa5d411b7bd1`, all published clean with no false 409s. TikTok
  `6a9682ca04e784fa465495a7` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list` and then via `posts_get`. Row 310 Complete.
- 2026-09-02 — twenty-second live run, sheet row 311, "How One AI Voice Agent
  Booked $74,000 of Work From 1,300 Calls". Push access verified first (local
  `main` was two commits behind `origin/main`, a plain fast-forward, not the
  proxy-auth failure the check guards against). No `PENDING-PUBLISH.md`
  backlog. `ffmpeg`, `ffprobe` and
  `imagemagick` needed reinstalling on this container. The queue topic's
  headline figure, "$74,000 of Work From 1,300 Calls," could not be sourced
  to anything real after several searches, the same failure mode as the Sora
  "$15M a day" figure on 2026-08-18 and the "58% of UK firms" figure on
  2026-08-19, so the post was built instead around well-corroborated UK
  missed-call figures: an average £24,000 a year lost per trades business
  (Digital X Marketing), rising to £33,000 for electricians specifically
  (ClearCall), 62% of inbound calls going unanswered, 85% of callers who hit
  voicemail not leaving a message, and a lead contacted within five minutes
  being 21 times more likely to convert (RadiusBoost). Illustration used the
  subject-left, clear-right convention throughout (3:2, 4:5, 9:16): a UK
  plumber working under a kitchen sink beside a smartphone showing an AI
  agent answering the call automatically. All three illustrations, both
  covers and the hybrid video QC'd clean on the first generation and first
  render, no regenerations needed; the 9:16 measured ~30% clear top and ~27%
  clear bottom by pixel bounding box, comfortably inside spec. Higgsfield
  balance was healthy (219.69 credits) so a real `kling3_0_turbo` animation
  ran; `media_import_url` worked cleanly, no `SignatureDoesNotMatch`. Draft
  presented and approved by Prad in-session before any publish call. Blog
  post 6851, https://kaizenaiconsulting.com/ai-phone-agents-missed-calls-uk-trades/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a97d1fd50bd9194dbaabed7`, X `6a97d20e9eb5feeccc23f8e1`, Instagram
  `6a97d231938c46d7b5738b77`, all published clean with no false 409s. TikTok
  `6a97d2355fc7cc8411099539` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list` and then via `posts_get`. Row 311 Complete.
- 2026-09-03 — twenty-third live run, sheet row 312, "46% of UK Construction
  Pros Now Use AI: Inside the £23,000 Productivity Gap". Push access verified
  first (local `main` was 7 commits behind `origin/main`, the same recurring
  stale-ref caching artefact logged repeatedly since 2026-08-21, fixed with
  `git branch -f main origin/main`). No `PENDING-PUBLISH.md` backlog and
  nothing built past 2026-09-02 (already confirmed live in the previous
  entry), so no orphaned drafts to clear. `ffmpeg`, `ffprobe` and
  `imagemagick` needed reinstalling on this container. Timeliness check found
  nothing from the prior 24-48h clearly stronger for this audience than the
  queued topic (checked Astra's cybersecurity benchmark, Gemini video
  updates, and the Anthropic/Sony-Warner Chappell suit; none UK-small-
  business-actionable), so took the next Pending row as normal. Illustration
  used the subject-left, clear-right convention throughout (3:2, 4:5, 9:16):
  a UK construction site supervisor checking a glowing AI assistant icon on
  a tablet beside a timber-frame house under scaffolding. All three
  illustrations were clean on the first generation, no regenerations needed.
  The first 3:2 cover render caught a genuine layout bug: the second
  headline line ("£23k saved a year.") ran into the roofline artwork on the
  right-cropped 3:2 composite, the same "long line runs into artwork"
  failure mode logged on 2026-08-04/08-05; fixed by shortening the line to
  "£23k a year." and re-rendering, clean on the rebuild. Higgsfield balance
  was healthy (204.69 credits pre-generation, 189.69 after) so a real
  `kling3_0_turbo` animation ran; `media_import_url` worked cleanly, no
  `SignatureDoesNotMatch`. Hybrid video QC'd clean on the first render across
  all checked frames (2.5s/6s/12.5s/17.3s/17.6s/20s). Draft presented and
  approved by Prad in-session before any publish call. This session's
  harness-level branch policy again defaulted to a feature branch (same
  conflict logged 2026-08-23 onward); pushed straight to `main` as every
  prior run has, all fast-forward, then also synced the feature branch to
  satisfy the harness's own unpushed-commit check. Blog post 6854,
  https://kaizenaiconsulting.com/uk-construction-ai-productivity-gap/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a99261a54fe6944941744fd`, X `6a99262906a98eddbd93de7e`, Instagram
  `6a992646ab8f26aa642e02cc`, all published clean with no false 409s. TikTok
  `6a99264a7b8c53715d7a1089` returned the known false 409 on
  `posts_create_post` but had actually been created, confirmed via
  `posts_list` and then via `posts_get`. Row 312 Complete.
- 2026-09-04 — twenty-fourth live run, sheet row 313, "Deepfake Scams Are Now
  a Top Fraud Threat: How to Protect Your Trades Business". No
  `PENDING-PUBLISH.md` backlog and nothing orphaned since the 2026-09-03 run
  (confirmed already live). Push access failed on the first `git push
  --dry-run origin main` with a non-fast-forward rejection; local `main` was
  one commit behind `origin/main`, the same recurring stale-ref caching
  artefact logged repeatedly since 2026-08-21, fixed with `git branch -f main
  origin/main`. `ffmpeg`, `ffprobe` and `imagemagick` needed installing on
  this container. Timeliness check (Fable 5.1/Mythos 5.1 launch, OpenAI
  GPT-Live, a Danish competition-authority AI statement) found nothing
  clearly stronger for a UK small-business audience than the queued topic, so
  took the next Pending row as normal. Sourced the piece around UK Finance's
  Annual Fraud Report 2026 rather than the weaker vendor-blog stats that
  first surfaced in search: £1.28bn total UK payment fraud losses in 2025 (up
  4%), APP/impersonation fraud up 19% to £576.4m, and invoice/mandate fraud
  specifically at £41.3m across 2,305 cases, averaging almost £18,000 a hit.
  Illustration used the subject-left, clear-right convention throughout (3:2,
  4:5, 9:16): a UK tradesperson beside his van, warily eyeing a phone with a
  pulsing incoming-call ripple and a warning-triangle icon. All three
  illustrations, both covers and the hybrid video QC'd clean on the first
  generation and first render, no regenerations needed. Higgsfield balance
  was healthy (189.69 credits) so a real `kling3_0_turbo` animation ran;
  `media_import_url` worked cleanly, no `SignatureDoesNotMatch`. Draft
  presented and approved by Prad in-session before any publish call. Blog
  post 6857, https://kaizenaiconsulting.com/deepfake-scams-uk-trades-protection/,
  Google Business post (accepted, PROCESSING at submission), LinkedIn
  `6a9a76e158012b405d85d9f8`, X `6a9a76f0b70edd0947d1392c`, both published
  clean with no false 409s. Instagram `6a9a7718068f4118c8df7564` published
  clean but took roughly 11 minutes to leave `publishing`/`processing`
  status, well beyond the usual few minutes for a cover-image stitch;
  confirmed via `posts_get_post` throughout that it was still in-flight
  (`publishAttempts: 0`, no `errorMessage`) rather than stuck, so waited it
  out rather than retrying. TikTok `6a9a771c068f4118c8df7670` returned the
  known false 409 on `posts_create_post` but had actually been created,
  confirmed via `posts_list` and then via `posts_get`. Row 313 Complete.
- 2026-09-05 — twenty-fifth live run, sheet row 314, "54% of UK Firms Use AI
  But Only 12% Earn More: Closing the Productivity-Profit Gap". No
  `PENDING-PUBLISH.md` backlog and nothing orphaned since the 2026-09-04 run
  (confirmed already live). Push access verified first, clean, no stale-ref
  issue today. `ffmpeg` and `imagemagick` needed installing on this container.
  Timeliness check found nothing clearly stronger for a UK small-business
  audience than the queued topic, so took the next Pending row as normal.
  Sourced the piece around the BCC/Atos "Future of Work" report (March 2026):
  54% of UK firms now use AI (up from 35%), 75% report a productivity gain,
  but only 12% see any revenue increase, with marketing and admin (72% each)
  the two most common uses. Illustration used the subject-left, clear-right
  convention throughout (3:2, 4:5, 9:16): a UK small business owner working
  quickly at a laptop surrounded by productivity checkmarks while a small
  stack of coins stays flat and stationary. The first 4:5 generation came
  back with the known top/bottom background seam plus a stray doodle mark
  near the figure's hand, fixed in one regeneration with the stronger
  single-canvas wording; the 3:2 and 9:16 were clean on the first pass.
  Higgsfield balance was healthy (174.69 credits) so a real `kling3_0_turbo`
  animation ran; `media_import_url` worked cleanly, no `SignatureDoesNotMatch`.
  Hybrid video QC'd clean on the first render across all checked frames. Hit
  the harness's feature-branch default again (same conflict logged repeatedly
  since 08-23): pushed straight to `main` as the runbook requires for both the
  covers/9:16 commit and the video commit, then synced the feature branch
  each time. Draft presented and approved by Prad in-session before any
  publish call. Blog post 6860,
  https://kaizenaiconsulting.com/ai-productivity-profit-gap/, Google Business
  post (accepted, PROCESSING at submission), LinkedIn
  `6a9bc96c53e41f024a45de9b`, X `6a9bc9790e57b4a521fb7110`, Instagram
  `6a9bc9863cffc18395464d49`, all published clean with no false 409s. TikTok's
  `posts_create_post` call itself timed out client-side after 60s; checked
  `posts_list` before retrying per the runbook's guidance and found the post
  had actually been created (`6a9bc98a3cffc18395464e8b`), confirmed published
  via `posts_get`, so no duplicate was sent. Row 314 Complete.
- 2026-09-06 — twenty-sixth run, stopped before drafting. Push access verified
  first (local `main` was 4 commits behind `origin/main`, the same recurring
  stale-ref caching artefact logged repeatedly since 2026-08-21, fixed with
  `git branch -f main origin/main`). `ffmpeg` and `imagemagick` needed
  installing on this container. No `PENDING-PUBLISH.md` backlog, and nothing
  orphaned since the 2026-09-05 run: `origin/main` HEAD matched that run's own
  logged commit exactly, no unlogged pushes in between. Read the full topic
  queue and found every row marked Complete, first time the queue has been
  exhausted rather than holding at least one Pending row. Ran the timeliness
  check anyway before concluding: nothing from the prior 24-48h (GPT-6 Astra's
  September 3 release, Fable 5.1 reaching general availability, routine
  regulatory-consultation news) was a clearly UK-small-business-actionable
  story on the bar set by past dynamic-topic picks (2026-08-24, 2026-08-31),
  and Astra-branded content was already covered as a dynamic topic on
  2026-08-31, so nothing justified building fresh assets without a queue row
  to ground the choice. Stopped per the runbook's explicit instruction rather
  than inventing a topic with no grounding. No Gemini or Higgsfield credits
  spent. Flagged to Prad: the "Kaizen AI Blog Automation" sheet needs new
  Pending rows added before the next run can draft anything.
- 2026-09-06 (same session, after Prad replied) — Prad set two changes live.
  First, an empty queue must no longer stop the run: generate a topic every
  day instead (recorded in the daily sequence and the topic queue section).
  Under that new rule the session drafted "Google and Screwfix Are Bringing
  Free AI Training to UK Trades" and built full assets: covers, 9:16 base and
  a `kling3_0_turbo` hybrid video, all QC'd clean and pushed to `main` at
  `image/2026-09-06-google-screwfix-ai-training-{3x2,4x5,9x16}.jpg` and
  `video/2026-09-06-google-screwfix-ai-training.mp4`. **Prad then redirected
  away from trades before approving it, so that topic was never published.**
  Those files are built-but-skipped, exactly like the 2026-08-30 EU AI Act
  set: noting it explicitly so a future run does not mistake them for an
  orphaned draft in the pattern hit on 08-13, 08-15/16, 08-19 and 08-23/24.
  Second, Prad set the new content direction now recorded in its own section:
  general small business rather than trades, hook-first openings, a mix of
  styles, and a voiced on-camera presenter built from a reference photo he
  supplied and authorised. The character reference was imported to Higgsfield
  as `331c3e04-d30d-4a9e-8202-063aaf95a0cb` (pushed to the repo briefly for
  the import, then removed; the commit remains in git history). Redrafted the
  day around that direction as "AI Just Changed the Game for Small Business:
  What You Can Actually Hand Over Now", sourced to the 3 September GPT-6 Astra
  release and the 76%-use / 14%-embedded adoption gap. Dropped an earlier
  21%/6% version of that gap when it would not verify, the same discipline
  applied on 08-18, 08-19 and 09-02. Video is the first mixed-style build: a
  15s voiced Seedance 2.5 presenter opener cut to the vector stat and end
  card, 22.6s total. Two build notes worth keeping: Google VEO is not in the
  Higgsfield catalogue at all, and a 15s 1080p Seedance clip is too big to
  come back through the media-fetch workflow (the MCP session expired twice),
  so presenter clips are generated at 720p. Assets pushed as
  `image/2026-09-06-ai-hand-over-jobs-{3x2,4x5}.jpg` and
  `video/2026-09-06-ai-hand-over-jobs.mp4`. Held at approval, nothing
  published for either topic today.