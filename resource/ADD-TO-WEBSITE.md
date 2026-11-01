# Instructions for Claude Code: add the guide to the Kaizen website's Resources section

I (the routine session) cannot reach kaizenaiconsulting.com, so I have not seen the existing Resources page or its PDFs. Match whatever the site already does; the points below are what to check and what to supply.

## The file
- `resource/kaizen-claude-for-small-business-10-workflows-ranked.pdf` (A4, 8 pages, built in house brand: navy `#0A1628`, electric blue `#2E7CF6`, teal `#17A57F`, light paper `#EAF0F9`, Space Grotesk headings, Inter body).
- Regenerate with `python3 resource/build_guide.py <out.pdf>` (needs the `engine/` fonts, logo and `playwright-core`; edit the `items`, `tools` and `prompts` lists at the top to update content).

## Steps
1. Look at the existing Resources section first: how PDFs are stored (Sanity file asset, `/public`, CDN), how each resource card is modelled (title, description, thumbnail, category, download link, order), and whether downloads are gated by an email form. Copy that pattern exactly. Do not invent a new schema if one exists.
2. Upload or copy the PDF the same way the other resources are. Use a stable, human filename such as `claude-for-small-business-10-workflows-ranked.pdf`.
3. Create the thumbnail the same way as the others (page 1 of the PDF is a good source: `pdftoppm -jpeg -r 100 -f 1 -l 1 <pdf> thumb`). If the existing cards use a different size or ratio, crop to match.
4. Add the resource entry:
   - Title: Claude for Small Business: 10 Workflows, Ranked
   - Description (under 160 characters): Anthropic says there are 43 workflows. Here are the 10 we would look at first, ranked, with prompts you can try in a normal chat today.
   - Category/service: Advise (`/advise/`), or the nearest equivalent on the site.
   - Date: 2 November 2026.
5. Link both ways with the blog article `https://kaizenaiconsulting.com/claude-small-business-workflows-ranked/` (it publishes on 2 November, so check it exists before linking; the slug comes from the publisher). On the article, add a "Download the PDF guide" link to the resource if the site has a pattern for that. Do not edit the article body otherwise.
6. Check: the PDF opens from the live link, the file size is under whatever limit the site uses (the file is small), the download has the right `Content-Type: application/pdf`, and the card looks right at phone width.
7. If the site gates downloads behind an email form, keep that, and confirm with Prad before wiring it to any mailing list.

## Content caveats (carry over, do not remove)
- The guide says "Correct as at 1 November 2026" and that Kaizen has not used the product. If you publish later than 2 November, update the date and re-check Anthropic's pages (claude.com/solutions/small-business and the September update blog post) for UK availability, pricing and workflow changes.
- No em dashes anywhere in site copy (Kaizen house rule). Cost figures are tool costs only; the 48 hours and £1,440 is clearly labelled as an illustration.
- Do not add the PDF to social posts. This routine handles those separately.
