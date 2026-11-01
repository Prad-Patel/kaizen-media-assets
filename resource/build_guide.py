import base64, html as H, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
eng = root / "engine"
def b64(p): return base64.b64encode(p.read_bytes()).decode()
logo = b64(eng / "brand/logo.png")
fonts = ""
for fam, w, f in [("Space Grotesk",500,"space-grotesk-latin-500-normal"),("Space Grotesk",700,"space-grotesk-latin-700-normal"),
                  ("Inter",400,"inter-latin-400-normal"),("Inter",600,"inter-latin-600-normal"),("Inter",800,"inter-latin-800-normal")]:
    fonts += "@font-face{font-family:'%s';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2')}\n" % (fam, w, b64(eng/"fonts"/(f+".woff2")))

items = [
 ("Speed to lead","/speed-to-lead","Answers new enquiries on nights and weekends with real meeting times, and logs them in your CRM. Nothing sends until you approve.","The customer who messages at 9pm usually goes to whoever replies first.","Connect your CRM and calendar first, then check the meeting times it offers are ones you can keep."),
 ("Chase invoices","Invoice chaser","Anthropic names an invoice chaser in the May launch. Its payroll workflow also chases overdue invoices before it readies the run.","Money owed is money you cannot spend, so this is the quickest route from admin to cash.","Read each reminder before it goes. The tone is yours to set."),
 ("Close the month","/close-month","Reconciles your books against payment processors, flags what does not match, and writes a plain-English profit and loss and a close packet for your accountant.","It saves the end-of-month scramble and gives your accountant clean material.","Works best with a connected accounting tool. Check yours is on the tools list."),
 ("Monday brief","/monday-brief","Cash, sales, pipeline, your calendar and your top priority on one page. Anthropic's example posts it to Slack at 6:30am.","It will not make money by itself, but it ends the Monday morning hunt for numbers.","Only as good as the tools connected to it."),
 ("Proposal builder","/proposal-builder","Turns a voice memo and site photos into a proposal in your format, priced from your last three deals.","Quotes are where small firms lose time and, sometimes, margin.","Check the price before it goes anywhere. A wrong proposal costs more than a slow one."),
 ("Plan payroll","/plan-payroll","Checks you will have the cash, chases overdue invoices and readies the payroll run for you to submit.","It overlaps with the invoice and month-end jobs above, so it ranks mid-table.","Payroll is staged for you. You press the button. Check UK specifics yourself."),
 ("Check margins","Margin analyser","Named in the May launch, with little detail published. The idea is to show which lines earn the least.","Many small firms do not know which products or jobs earn the least.","You can try a rough version in a normal Claude chat today (see the prompts later in this guide)."),
 ("Social content engine","/social-content-engine","Plans next week's content, for example a two-week posting calendar with captions for your approval.","Useful, but a draft calendar is easier to replace than a late invoice.","Edit every caption. It should sound like you."),
 ("Grow pipeline","/grow-pipeline","Finds prospects who resemble your best customers and writes outreach in your voice.","Potentially valuable, but outreach in your name is your reputation.","Read every message before it goes out."),
 ("Build agent","/build-agent","Turns a recurring manual task into a workflow you can run by name or on a schedule.","You need to know which task to automate first, and the nine above are a good way to find out.","Start by describing one task you do every week."),
]
tools = "Airwallex, Apollo, Atlassian, Canva, Clay, Docusign, Emergent, Expensify, Gmail, Google Calendar, Google Drive, Gusto, HubSpot, Intuit Mailchimp, Intuit QuickBooks, Microsoft 365, monday.com, MYOB, NetSuite, Notion, PayPal, Ramp, RingCentral, Salesforce, Shopify, Slack, Square, Stripe, TikTok Ads, Trello, Wix, Xero, Zapier, Zoho Books, Zoho CRM, Zoho Desk and Zoom".split(", ")
prompts = [
 ("Chase invoices","Put these in order of who to chase first. For each, draft a short, polite reminder in a friendly British tone, firmer for anything over 30 days late. Do not send anything.","Paste a list of overdue invoices first."),
 ("Check margins","Work out the profit margin on each line as a percentage. Show me the three lowest and suggest one change for each, and tell me what you are assuming.","Paste what you sold, what each item cost and what you charged. Check the sums yourself before you act on them."),
 ("Speed to lead","Sort these into hot, warm and cold with one line on why. For the hot ones, draft a reply offering two times for a call this week.","Paste your last ten enquiries first."),
]
e = H.escape
def page(inner, cls=""): return '<section class="page %s">%s<footer><span>Kaizen AI Consulting</span><span>kaizenaiconsulting.com</span></footer></section>' % (cls, inner)

pages = []
pages.append('''<section class="page cover"><div class="band"><img class="logo" src="data:image/png;base64,%s"></div><div class="kick">FREE GUIDE</div>
<h1>Claude for Small Business:<br><em>10 workflows, ranked</em></h1>
<p class="sub">Anthropic says there are 43. These are the ten we would look at first, most useful to least, with what to check before you switch each one on.</p>
<div class="covfoot"><div>Correct as at 1 November 2026</div><div>kaizenaiconsulting.com</div></div></section>''' % logo)

pages.append(page('''<h2>Before you start</h2>
<p class="lead">Claude for Small Business is a plugin that runs inside Claude Cowork, Anthropic's desktop app. According to Anthropic's September update it is available on every paid Claude plan. Anthropic's small business page describes Pro for one person and Team for a business with more than one, both month to month, but lists no prices.</p>
<div class="callout"><b>Approval first.</b> Workflows start in approval mode, so Claude drafts and prepares and you decide. Payroll is staged for you to submit, bills wait for your approval before payment, and nothing sends without your say-so by default.</div>
<div class="callout warn"><b>Two honest caveats.</b> There is no UK date or UK pricing on any of Anthropic's pages, and we have not used the product ourselves. Treat this guide as a map of what exists, not a promise of what you can switch on in Britain today.</div>
<h2>How we ranked them</h2>
<p>This is our judgement, based only on what Anthropic has published about each workflow. The test: how much does this job cost a small business when it goes wrong, and how much of it can Claude safely prepare for you? Jobs that cost you money when missed, such as an unanswered enquiry or a late invoice, come first.</p>
<h2>The ranking at a glance</h2>
<ol class="glance">%s</ol>''' % "".join("<li><span>%d</span>%s</li>" % (i+1, e(t[0])) for i,t in enumerate(items))))

for i, n_ in [(0,3),(3,4),(7,3)]:
    chunk = items[i:i+n_]
    inner = "" if i else "<h2>The ranking, most useful first</h2>"
    for j, (n, cmd, what, why, check) in enumerate(chunk):
        k = i+j+1
        inner += '''<div class="item"><div class="num">%02d</div><div class="body"><h3>%s</h3><div class="cmd">%s</div>
<p>%s</p><div class="two"><div><b>Why it ranks here</b><p>%s</p></div><div><b>Check before you use it</b><p>%s</p></div></div></div></div>''' % (k, e(n), e(cmd), e(what), e(why), e(check))
    pages.append(page(inner))

inner = '''<h2>The rest of the list</h2><p>Anthropic's pages also name Pay the bills, Call list, Restock, Marketing Monday, Win back lapsed customers, Lead triager, Contract reviewer, Month-end prepper, Tax-season organiser, Onboarding and Build connector. Tax prep covers quarterly taxes and 1099s, which are US terms, so check what applies to a UK firm before relying on it. Anthropic says there are 43 workflows in total but names only some publicly. It names no separate HR or customer service workflows.</p>
<h2>The 37 tools it connects to</h2><p>Listed in Anthropic's September update. Several are common in the UK, such as Xero, QuickBooks, Shopify, Stripe and Google Workspace. Others are US-centred, so check each one against how you actually work.</p>
<div class="chips">%s</div>''' % "".join("<span>%s</span>" % e(t) for t in tools)
pages.append(page(inner))

inner = '''<h2>Three jobs to try today in a normal chat</h2>
<p>You can do a rough version of the top jobs in a normal Claude chat with a few pasted lines. These prompts are our adaptations of the job names, not Anthropic's wording, and you read every draft before anything goes out.</p>'''
for n, p, note in prompts:
    inner += '<div class="prompt"><b>%s</b><div class="pbox">%s</div><p class="note">%s</p></div>' % (e(n), e(p), e(note))
inner += '''<h2>What it could be worth</h2>
<p>Here is arithmetic on our assumptions, not Anthropic's. Say the money admin in your week (chasing payments, checking margins, sorting enquiries) takes three hours. If a workflow trims a third of that, you get an hour back a week. Over 48 working weeks that is about 48 hours, or six working days. At &pound;30 an hour that is roughly &pound;1,440 a year of time.</p>
<p class="note">Your numbers will differ, so time your own week first. It is an illustration, the plans cost money, and the saving only exists if you use the drafts.</p>'''
pages.append(page(inner))

pages.append(page('''<h2>Where to start</h2>
<ol class="steps"><li><b>Pick one job.</b> Choose the top job that fits your week. Do not switch on forty workflows.</li>
<li><b>Try the copy-paste version for a fortnight.</b> Compare it with doing the job by hand.</li>
<li><b>Connect a tool if it earns its place.</b> Link your accounting or CRM tool so Claude can read the real figures.</li>
<li><b>Keep the approval switch on.</b> Read every draft before it sends, posts or pays.</li></ol>
<div class="cta"><div class="ctah">Not sure which job to hand over first?</div><p>We run a free 30 minute AI audit for small businesses. We will look at your week and tell you where AI would genuinely help, and where it would not.</p>
<div class="ctab">calendly.com/prad-kaizenaiconsulting/new-meeting</div><div class="ctas">020 3432 0345 &nbsp;|&nbsp; info@kaizenaiconsulting.com &nbsp;|&nbsp; kaizenaiconsulting.com</div></div>
<h2>Sources</h2>
<p class="src">Anthropic, "Claude for Small Business launches new workflows, integrations and training programs" (claude.com/blog/claude-for-small-business-launches-new-workflows-integrations-and-training-programs) and Anthropic's small business page (claude.com/solutions/small-business), as read on 31 October 2026. Rankings, prompts and the time-saving illustration are Kaizen's own. Product details change often, so check Anthropic's pages for the latest. Kaizen AI Consulting, 85 Great Portland Street, London.</p>'''))

css = fonts + '''
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Inter,sans-serif;color:#0A1628;font-size:10.5pt;line-height:1.5}
.page{width:210mm;height:297mm;padding:22mm 20mm 24mm;position:relative;page-break-after:always;overflow:hidden;background:#fff}
h1{font-family:'Space Grotesk';font-weight:700;font-size:38pt;line-height:1.08;margin:0 0 8mm}h1 em{font-style:normal;color:#2E7CF6}
h2{font-family:'Space Grotesk';font-weight:700;font-size:17pt;margin:8mm 0 3mm;color:#0A1628}h2:first-child{margin-top:0}
h3{font-family:'Space Grotesk';font-weight:700;font-size:15pt;margin:0 0 1mm}
p{margin:0 0 3mm}.lead{font-size:11.5pt}
footer{position:absolute;left:20mm;right:20mm;bottom:10mm;display:flex;justify-content:space-between;font-size:8pt;color:#6A7A93;border-top:.3mm solid #D5DEEE;padding-top:3mm}
.cover{background:#EAF0F9;padding-top:0}.cover .band{background:#0A1628;margin:0 -20mm 30mm;padding:12mm 20mm}.cover .logo{height:18mm;display:block}.kick{color:#17A57F;font-weight:800;letter-spacing:.25em;font-size:10pt;margin-bottom:6mm}
.sub{font-size:14pt;color:#3A4A66;max-width:150mm}.covfoot{position:absolute;left:0;right:0;bottom:0;background:#0A1628;color:#fff;display:flex;justify-content:space-between;padding:9mm 20mm;font-size:10pt}
.callout{background:#EAF0F9;border-left:1.2mm solid #2E7CF6;padding:4mm 5mm;margin:0 0 4mm;border-radius:1mm}.callout.warn{border-color:#FF5A5F;background:#FFF1F1}
.glance{list-style:none;margin:0;padding:0;columns:2;column-gap:8mm}.glance li{display:flex;align-items:center;gap:3mm;padding:2mm 0;font-weight:600;border-bottom:.3mm solid #E3EAF6;break-inside:avoid}
.glance span{background:#0A1628;color:#fff;border-radius:50%;width:7mm;height:7mm;display:inline-flex;align-items:center;justify-content:center;font-size:9pt;font-family:'Space Grotesk'}
.item{display:flex;gap:6mm;margin:0 0 4mm;padding-bottom:3.5mm;border-bottom:.3mm solid #E3EAF6;break-inside:avoid}.item:last-child{border:0}
.num{font-family:'Space Grotesk';font-weight:700;font-size:30pt;color:#2E7CF6;width:18mm;line-height:1}.body{flex:1}
.cmd{display:inline-block;font-size:8.5pt;color:#17A57F;font-weight:600;margin-bottom:2mm;letter-spacing:.03em}
.two{display:flex;gap:5mm}.two>div{flex:1;background:#F4F7FC;padding:3mm 4mm;border-radius:1.5mm}.two b{font-size:8pt;letter-spacing:.1em;text-transform:uppercase;color:#17A57F}.two p{margin:1mm 0 0;font-size:9pt;line-height:1.4}
.chips{display:flex;flex-wrap:wrap;gap:2mm}.chips span{background:#EAF0F9;border-radius:5mm;padding:1.2mm 3.5mm;font-size:9pt;font-weight:600}
.prompt{margin-bottom:5mm}.pbox{background:#0A1628;color:#fff;border-radius:2mm;padding:4mm 5mm;margin:1.5mm 0;font-size:10pt}.note{font-size:9pt;color:#5A6A85}
.steps{padding-left:5mm}.steps li{margin-bottom:3mm}.cta{background:#0A1628;color:#fff;border-radius:3mm;padding:8mm;margin:8mm 0}.ctah{font-family:'Space Grotesk';font-weight:700;font-size:16pt;margin-bottom:3mm}
.ctab{background:#2E7CF6;display:inline-block;padding:3mm 5mm;border-radius:2mm;font-weight:600;margin:2mm 0 4mm}.ctas{font-size:9pt;color:#B9C6DE}.src{font-size:8.5pt;color:#5A6A85}
'''
doc = "<!doctype html><meta charset=utf-8><title>Claude for Small Business: 10 workflows, ranked</title><style>%s</style>%s" % (css, "".join(pages))
out = pathlib.Path(sys.argv[1]); tmp = out.with_suffix(".html"); tmp.write_text(doc)
js = """const {chromium}=require('/home/user/kaizen-media-assets/engine/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://%s');await p.evaluate(()=>document.fonts.ready);await p.pdf({path:'%s',format:'A4',printBackground:true,preferCSSPageSize:true});await b.close()})()""" % (tmp, out)
subprocess.run(["node","-e",js],check=True); tmp.unlink()
