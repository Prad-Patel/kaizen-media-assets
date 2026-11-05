# Pending publish

**2026-11-06 "my AI stack" post: Prad said "Publish tomorrow" on 2026-11-05 (in-session, after reviewing the drafts). Part is already scheduled in Zernio; the rest must be run on 2026-11-06.**

Already scheduled in Zernio for 2026-11-06 09:00 UTC (09:00 UK), created 2026-11-05 22:50 UTC, `status: scheduled`:
- LinkedIn personal profile document post `6aed082fcdbc6ffd7a8dbdc7` (PDF via jsDelivr, documentTitle "The 9 AI tools I rely on", first comment with blog and Calendly links set on the post)
- X `6aed0831cdbc6ffd7a8dbdd0` (4:5 cover, caption carries the blog and Calendly links)
- Instagram `6aed0832cdbc6ffd7a8dbdde` (video, 4:5 reel cover)
- TikTok `6aed0834cdbc6ffd7a8dbdef` (video, 4:5 cover)

Still to do on 2026-11-06 (these cannot be pre-scheduled):
1. **Website and Google Business via n8n publisher `QkD45M0Zd1J7Seor`**, ideally before 09:00 UTC so the blog link in the X caption and the LinkedIn first comment is live when they post. Body: title "The 9 AI Tools I Rely On to Run Kaizen, and Why", slug `my-ai-stack-9-tools`, contentHtml from `drafts/2026-11-06-my-ai-stack.html`, summary = the Google Business text in `drafts/2026-11-06-my-ai-stack-captions.md`, imageUrl the 3:2 cover `image/2026-11-06-my-ai-stack-3x2.jpg` (raw.githubusercontent), seoTitle "My AI Stack: 9 Tools I Rely On and Why | Kaizen", seoDescription from the captions file, service `/advise/`.
2. **Kaizen page LinkedIn reshare** (account `69f34174985e734bf3e06b70`) once the personal post is published: `platformSpecificData.reshareUrl` = the personal post's `platformPostUrl`, content "Nine tools, one job each. Here is the stack behind Kaizen, straight from Prad.", no media, no links.
3. Verify all five Zernio posts with `posts_get_post` after they go out and report. Check the website post and its `ignored` field. Log the run in `RUNBOOK.md`.

Approval status: Prad's "Publish tomorrow" is the live approval for exactly this content and nothing else. If the daily routine's own rules want a fresh confirmation before steps 1 and 2, ask Prad in the session and do not draft a new topic until this is cleared.
