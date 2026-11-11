# Brief from Prad (2026-11-11), for the post on Friday 2026-11-13. Kept verbatim; the voice rules (no em dashes, British spelling) still apply to everything written from it.

BRIEF: Social post — "Do you actually need Docker? A vibe coder's guide"

OBJECTIVE
Write a post that explains Docker in plain English to people who build apps with AI
coding tools (Claude Code, Cursor, Lovable, Bolt, etc.) but don't have a traditional
dev background. Readers should come away knowing what Docker is, why their AI tool
sometimes asks for it, and when they can skip it.

AUDIENCE
"Vibe coders": founders, marketers, operators and hobbyists building real apps with AI.
They're smart and practical, but terms like "container", "Postgres" and "WSL2" put
them off. They want to know what to do, not the theory.

CORE MESSAGE (one line)
Docker is a lunchbox for your app. Use it when your project has a database you could
break. Skip it for everything else.

KEY POINTS TO COVER (in this order)

1. The hook / the pain
   - Your AI coding tool says "install Docker" and you have no idea why.
   - Or the classic: "it works on my machine" but breaks everywhere else.

2. The like-I'm-5 explanation
   - You build a LEGO castle at home and want to show a friend. At their house the
     pieces are different and the table is wobbly, so it falls apart.
   - Put the castle in a lunchbox with every piece it needs and its own little table.
     Now it works the same anywhere you open it.
   - Docker is that lunchbox for software: your app plus everything it needs, packed
     so it runs the same on any computer.

3. Why AI coding tools ask for it
   - Tools like Supabase can run a full copy of your backend (database, logins, file
     storage) on your own laptop using Docker.
   - That gives the AI a safe practice copy. It can test, break things and reset
     without touching your real users or live data.
   - Mistakes happen on the copy. Only finished, tested changes go to the real thing.

4. When to use it vs skip it
   USE Docker when the project has:
   - A database you'll test against (Supabase, Postgres, MySQL, Redis)
   - Several services that need to run together (website + API + database)
   - Plans to deploy as a container (Fly.io, Railway, Cloud Run, a VPS)
   SKIP it for:
   - Landing pages and static sites
   - Frontend-only apps that call hosted APIs
   - Simple scripts and automations
   - Quick prototypes (add it later if the project grows)
   - Sites deployed on Vercel or Netlify

5. The one-question rule (make this the memorable takeaway)
   "If the AI makes a mistake here, could it damage data I care about?"
   Yes: use Docker (or a separate test/staging project).
   No: keep it simple and skip it.

6. Honest caveat (builds trust)
   - Docker Desktop uses a few GB of RAM, so don't leave it running for projects that
     don't need it.
   - The local copy starts empty. It's for testing, not a replacement for your real
     database.

TONE & STYLE
- Friendly, confident and practical. Like a builder sharing a lesson they learned,
  not a lecture.
- Plain English. Explain any technical term in a few words the first time, or leave
  it out.
- Short sentences and lots of white space. Easy to skim on a phone.
- No hype words ("game-changer", "revolutionary", "unlock"). No fear-mongering.
- Emojis: light use only, if they fit the platform.

FORMAT OPTIONS (produce whichever fits the target platform)
- LinkedIn: 1,200–1,800 characters, hook in the first 2 lines, short paragraphs,
  ending in a question to drive comments.
- X/Twitter: a 6–8 post thread. Post 1 is the hook; the last post is the
  one-question rule plus a CTA.
- Instagram/LinkedIn carousel: 7–9 slides, one idea per slide, with the LEGO
  lunchbox analogy as the visual theme.

CALL TO ACTION (pick one)
- "What's the most confusing thing your AI coding tool has asked you to install?"
- "Save this for the next time your AI tells you to install Docker."

ACCURACY GUARDRAILS (do not get these wrong)
- Don't say AI coding tools "require" Docker. Docker is needed by some projects'
  tooling (e.g. running Supabase locally), not by the AI tool itself.
- Don't claim Docker makes apps faster or more secure in general. The benefits are
  consistency, separation between apps, and safe local testing.
- Don't say Docker replaces your hosting or your production database.
- Containers are lighter than virtual machines because they share the computer's
  operating system. If you include this, keep it to one line.

HASHTAGS (optional, max 3–5)
#VibeCoding #BuildInPublic #NoCode #AIcoding #Docker #KaizenAI
