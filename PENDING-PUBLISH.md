# PENDING PUBLISH — Canva AI 2.0 (approved 2026-08-05, blocked 5 to 8 August)

Prad approved this content on 2026-08-05. It did not publish because the
pipeline was running as a Cowork scheduled task with no repository attached,
so every `git push` was refused by the proxy. That is fixed by the move to a
Claude Code routine.

**Publish this before drafting any new topic.** Slug: `canva-ai-2-marketing`.
The sheet row (topic "Canva AI 2.0: The Biggest Canva Change in a Decade and
What It Means for Your Marketing", the first Pending row) stays Pending until
it is live.

**The 2026-08-05 approval is a historical record, not live consent.** Rebuild
the assets, show them to Prad in the current session, and get an explicit go
before publishing. Then delete this file in the same commit that logs the run.

## Freshness

Checked 2026-08-08 and still accurate. The copy dates Canva Code 2.0 to 14
July and AI 2.0 to April, both of which stay true however long this sits, and
nothing says "this week" or "just launched". A web check on 2026-08-08 found
no newer Canva release that changes the angle. Re-check if it slips past the
end of August.

## Assets to rebuild

1. **9:16 base illustration** (also the video base), Higgsfield media
   `20f8d9ce-3a2d-4fa6-9c3a-b4f13360b8ee`:
   https://d2ol7oe51mr4n9.cloudfront.net/user_2xb99jH8XmePIBetYVouNvY1U29/20f8d9ce-3a2d-4fa6-9c3a-b4f13360b8ee.jpg
   Fetch via Media Fetch workflow `T89V0h08JMpWkCE5`. Commit as
   `image/2026-08-05-canva-ai-2-marketing-9x16.jpg`.
2. **3:2 and 4:5 raw illustrations** are in n8n Gemini workflow
   `FqYH4E3KZywda1ON` execution data: execution `54146` (3:2) and `54147`
   (4:5), node "Binary to Base64", `json.imageBase64` (jq + base64 -d). If
   those executions have aged out, regenerate with the same prompt.
3. **Covers**: `render_cover.sh` with config
   `{ "image": <illustration>, "kicker": "Canva AI 2.0 and Code 2.0",
   "headline": ["A sentence in.", "A website out."], "footer": false }`
   at 1200x800 for the 3:2, and `footer: true` at 1080x1350 for the 4:5.
   Output names: `image/2026-08-05-canva-ai-2-marketing-3x2.jpg`, `-4x5.jpg`.
   The 14/14-character headline pair is deliberate; longer lines grazed the
   centre-frame artwork.
4. **Video**: the kling clip is durable at
   https://d8j0ntlcm91z4.cloudfront.net/user_2xb99jH8XmePIBetYVouNvY1U29/hf_20260805_125730_9e1d7987-97b2-4e07-a4dc-89caeed09891.mp4
   (fetch via `T89V0h08JMpWkCE5`, job `9e1d7987-97b2-4e07-a4dc-89caeed09891`).
   Render:
   `render_hybrid.sh config.json clip.mp4 video/2026-08-05-canva-ai-2-marketing-r2.mp4 22.0`
   with config.json exactly:
   `{ "hook": ["CANVA JUST CHANGED", "EVERYTHING."], "points": [["Describe a design. Canva builds it."], ["Type a sentence. Get a website."], ["Free on every single account."]], "stat": { "pre": "6 MILLION SITES BUILT FROM PROMPTS.", "big": "IN ONE YEAR.", "post": "SAME TOOLS. IDENTITY IS THE EDGE." }, "cta": "FREE 30-MIN STRATEGY CALL", "tagline": "Make AI design look like you.", "url": "kaizenaiconsulting.com" }`
   Publish the `-r2` filename.

Remember `npm install` in `engine/` after a fresh clone, and pass all config
and output paths as absolute paths.

## Publish plan

- WP publisher `QkD45M0Zd1J7Seor`: title "Canva AI 2.0: The Biggest Canva
  Change in a Decade and What It Means for Your Marketing", slug
  `canva-ai-2-marketing`, contentHtml below, summary below, imageUrl = raw
  URL of the 3:2 cover, imageAlt "Flat vector illustration of a business owner
  typing one line while geometric shapes assemble into a website".
- Zernio: LinkedIn, Instagram and TikTok get the video via the version-less
  jsDelivr URL; X gets the 4:5 raw URL; Instagram reel cover and TikTok cover
  are the 4:5. Captions below, verbatim (all length-validated, X is 197/280).
- Then sheet row to Complete via `96DUquYtdDHveiqF`, log the run in
  `RUNBOOK.md`, and delete this file.

## Google Business summary

Canva AI 2.0 and Code 2.0 have turned Canva into a conversational design studio and free website builder. 6 million sites were built from prompts in a year. We break down what shipped, what it costs UK small businesses, and how to use it without looking like everyone else.

## LinkedIn caption

Canva just had its biggest year in a decade, and most small businesses have not noticed yet.

In April, Canva AI 2.0 rebuilt the platform around conversation: describe what you want, get a fully editable design with your brand fonts and colours already applied. On 14 July, Canva Code 2.0 went further and gave every account, including free ones, the ability to build a working website from a written prompt.

The numbers are worth sitting with. The Canva community built 6 million sites with Canva Code in its first year. Code generation is now 75% faster than at launch. And it all sits on the £0 plan, when a standard UK agency site runs £3,000 to £8,000.

Here is the uncomfortable part. Your competitors have the same generator you do. Six million prompt-built sites means the risk is not looking artificial, it is looking interchangeable. A trades business in Leeds and one in Luton typing similar prompts get similar sites, similar colours, similar copy.

The winners feed the tool something distinctive: a proper brand kit, real photographs of real jobs, actual customer language, and specifics a generator cannot invent. The tool amplifies whatever identity you give it. Give it nothing and you get the average of everyone else.

We broke down what shipped, what it costs and how we would use it this month: https://kaizenaiconsulting.com/canva-ai-2-marketing/

If you want a second pair of eyes on what these releases could replace in your marketing spend, book a free 30 minute strategy call: https://calendly.com/prad-kaizenaiconsulting/new-meeting

## Instagram caption

Canva now builds entire websites from one sentence. Free.

6 million sites were built with Canva Code in its first year, and on 14 July the 2.0 release opened it to every account, including free ones. Type what you want, get a working site, then edit it like any other Canva design. No developer, no agency invoice.

The catch nobody mentions: your competitors have the same generator. Six million prompt-built sites means the risk is not looking artificial, it is looking identical to everyone else in your area.

The fix is what you feed it. Set up your brand kit before you generate anything. Use real photos of real jobs. Write in your customers' words, not the AI's. The tool amplifies whatever identity you give it.

Full breakdown on the blog, link in bio.

#CanvaAI #SmallBusinessUK #AItools #DigitalMarketing #UKBusiness #WebDesign #MarketingTips #AIforBusiness

## TikTok caption

Canva builds full websites from one sentence now, on the free plan. 6 million sites in a year. The problem? Everyone gets the same generator, so everyone ends up looking the same. Your brand kit, your real photos and your customers' words are the difference. Full breakdown on the blog, link in bio. #CanvaAI #SmallBusinessUK #AItools #WebDesign

## X caption

Canva Code 2.0 is now free on every account. 6 million sites built from a sentence in a year. Identity is the edge now.

Breakdown: https://kaizenaiconsulting.com/canva-ai-2-marketing/
Free 30 min call: https://calendly.com/prad-kaizenaiconsulting/new-meeting

## Blog HTML (contentHtml, verbatim)

<p>Canva has spent 2026 quietly rebuilding itself. In April it launched <a href="https://www.forbes.com/sites/marksparrow/2026/04/16/canva-ai-20-launches-with-new-features-and-conversational-ai/">Canva AI 2.0</a>, a conversational redesign of the whole platform. Then on 14 July it pushed <a href="https://www.canva.com/newsroom/news/Canva-Code/">Canva Code 2.0</a> out to every account, including free ones. Between the two, the tool that most UK small businesses already use for social graphics has become something much bigger: a design department, a website builder and a marketing assistant that you drive by typing sentences.</p>

<p>We have been testing these releases since they landed, and this is the change we think matters most for small business marketing this year. Here is what actually shipped, what it costs, and where we would be careful.</p>

<h2>What Canva AI 2.0 actually does</h2>

<p>The headline change is conversational design. Instead of starting from a blank canvas or a template, you describe what you want in plain language and Canva generates a fully editable design. Not a flat AI image, an editable file, with layers, brand fonts and elements you can move around afterwards.</p>

<p>Underneath that sit a few features that matter more than the demo videos suggest. Brand Intelligence applies your fonts, colours and style automatically, so the output starts on-brand rather than generic. Living Memory learns your preferences over time. Connectors pull live content in from Slack, Notion, Gmail, Google Drive and Google Calendar. And Automated Tasks will run jobs in the background, such as generating a week of social content in multiple languages while you get on with billable work.</p>

<p>Canva says its in-house AI models run up to 7 times faster and 30 times cheaper than comparable alternatives, which is why so much of this is available on the free tier rather than locked behind an enterprise plan. The platform now has 265 million monthly active users, and its AI products have been used more than 32 billion times.</p>

<h2>Canva Code 2.0: websites from a sentence, on the free plan</h2>

<p>The July release is the one we would pay closest attention to. Canva Code turns a written prompt into a working website or interactive app, and version 2.0 makes it available to the entire Canva community: free, Pro, Business, Enterprise and Education accounts alike.</p>

<p>The numbers behind it are the story. In its first year, the Canva community built more than 6 million sites with Canva Code. Code generation is now 75 per cent faster than at launch, and the median time from prompt to published page has dropped by 30 per cent. There are more than 50 starter templates, you can import existing HTML and make it editable, and you can publish to a free Canva domain or connect your own.</p>

<p>The 2.0 change that matters for non-technical owners is visual editing. The first version generated code you could not easily touch. Now the generated site opens in the familiar Canva editor, so you can swap images, change copy and adjust colours the same way you would edit a social post. No developer required for the small changes that used to mean a support ticket and an invoice.</p>

<h2>What this means for your marketing budget</h2>

<p>We will name the comparison everyone is thinking about. A standard small business website in the UK typically costs <a href="https://www.expertsure.com/uk/web-design/website-design-costs-guide/">£500 to £10,000 from a freelancer, and £3,000 to £8,000 from a regional agency</a>, with London firms starting higher. Canva Code 2.0 produces a working, editable, mobile-responsive site on a plan that costs nothing, and the wider AI 2.0 toolset comes with Canva Pro at £13 a month.</p>

<p>That does not make agencies obsolete. A campaign site that needs custom integrations, serious SEO work or e-commerce still justifies professional build costs. But for the landing page supporting one offer, the event page, the one-page site for a new service, or the microsite you want live this week, the honest answer is that the free tool is now good enough. We built a working landing page from a four-sentence prompt in under ten minutes during testing, then edited it in the normal Canva editor.</p>

<h2>The uncomfortable part: 6 million sites that all look the same</h2>

<p>Here is the statistic we would sit with. Six million sites built from prompts in a year means your competitors have access to exactly the same generator you do. Canva's own co-founder, Cameron Adams, put it plainly at the Code 2.0 launch: when everyone has access to the same AI, the thing that sets you apart is whether what you make actually looks like you.</p>

<p>We see this constantly in the AI work we do with UK small businesses. The risk is no longer that AI output looks obviously artificial. The risk is that it looks competent and completely interchangeable with every other business in your postcode. A plumber in Leeds and a plumber in Luton typing similar prompts will get similar sites, similar colour schemes and similar copy.</p>

<p>The businesses that win with these tools are the ones that feed them something distinctive: real photographs of real jobs, a brand kit set up properly in Brand Intelligence, actual customer language rather than generic claims, and prices, guarantees and specifics that a generator cannot invent. The tool amplifies whatever identity you give it. Give it nothing and you get the average of everyone else.</p>

<h2>How we would use it this month</h2>

<p>First, set up your brand kit before you generate anything. Logo, exact colours, fonts, tone words. Every AI 2.0 feature keys off it, and it is the difference between output that looks like you and output that looks like everyone.</p>

<p>Second, pick one contained job for Canva Code: a landing page for your best offer, with one form and one purpose. Prompt it, edit it in the visual editor, put it on a domain, and point one ad or one email at it. You will learn more from that than from a month of reading about AI.</p>

<p>Third, try Automated Tasks on your weekly social content, but review before anything posts. The generation is fast; the judgement about what represents your business still has to be yours.</p>

<p>And keep your measurements honest. A free site that converts nobody costs more than an agency site that books jobs. Track enquiries, not how impressed you are with the tool.</p>

<h2>Where Kaizen fits</h2>

<p>We help UK founders, small businesses and trades put AI to work properly, which usually means less time choosing tools and more time wiring them into how the business actually wins work. If you want a second pair of eyes on what Canva's new releases could replace in your current marketing spend, and where they would fall short for your specific business, we offer a free 30 minute strategy call. Bring your current website and your last month of marketing costs and we will go through it together.</p>
