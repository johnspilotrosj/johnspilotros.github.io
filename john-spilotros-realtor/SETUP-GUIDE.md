# Going Live — John Spilotros Real Estate (spilo.xyz on GitHub Pages)

The site is hosted on **GitHub Pages** at **spilo.xyz**. This guide covers the
two things left: (1) get the new files into your repo, and (2) turn on the
**listings admin** so you can add homes without touching code. Plus the contact
form and the personal info to fill before you promote it.

---

## What's on the site

```
(repo root)
├── index.html, listings.html, about.html, buyers-sellers.html, contact.html
├── 404.html                ← branded "page not found" (GitHub Pages serves it)
├── styles.css, app.js      ← design + interactions (no build step)
├── data/listings.json      ← your listings live here (the admin edits this)
├── .pages.yml              ← config for the Pages CMS admin
├── assets/uploads/         ← listing photos you upload land here
├── robots.txt, sitemap.xml ← search-engine basics
└── SETUP-GUIDE.md          ← this file
```

- **Listings page** reads `data/listings.json` and shows a polished "new
  listings coming soon" message when empty (it is right now — no fake homes).
- **Admin** = Pages CMS (hosted, free). You sign in with GitHub, it edits this
  repo, and GitHub Pages rebuilds automatically.
- **Contact + Home-value forms** are ready for Formspree (Part 3).

> Why not the `/admin` on your own domain? That (Decap CMS) needs Netlify's
> login service or a self-hosted OAuth server — neither works on plain GitHub
> Pages. Pages CMS is built exactly for GitHub-hosted sites and needs none of
> that, so it's the right tool here.

---

## Part 1 — Get these files into your GitHub repo

Your site is already live, but these files are **new/updated** and need to be in
the repo (at the **top level**, where your existing `index.html` is):

`listings.html`, `.pages.yml`, `data/listings.json`, `404.html`, `robots.txt`,
`sitemap.xml`, and the updated `index.html`, `about.html`, `buyers-sellers.html`,
`contact.html`, `styles.css`, `app.js`.

Easiest way (no tools):
1. Go to your repo on github.com → **Add file → Upload files**.
2. Drag in everything from your `john-spilotros-realtor` folder. Confirm files
   land at the **same level** as your current `index.html`.
3. **Important — the `.pages.yml` dotfile:** GitHub's drag-and-drop sometimes
   skips files that start with a dot. If you don't see `.pages.yml` in the
   upload list, instead do **Add file → Create new file**, name it exactly
   `.pages.yml`, and paste in the contents of the local `.pages.yml`.
4. **Commit changes.** GitHub Pages redeploys in ~1 minute. Visit
   `https://spilo.xyz/listings.html` to confirm the new Listings page is live.

> If you use GitHub Desktop, just drop the files into the local repo folder,
> then Commit + Push — same result.

---

## Part 2 — Turn on the listings admin (Pages CMS)

1. Go to **https://pagescms.org** and click **Sign in / Get started** →
   **Sign in with GitHub**.
2. Authorize Pages CMS for your account. When it asks which repositories,
   grant access to **just your website repo** (you don't have to share all
   repos).
3. Pick your repo. Pages CMS reads `.pages.yml` and shows a **Home Listings →
   Listings** editor.
4. Click **Add an item**, fill in the fields (status, price, address, beds,
   baths, photos, description…), upload photos, and **Save**.
5. Pages CMS commits to your repo; GitHub Pages rebuilds; your listing appears
   on `spilo.xyz/listings.html` within ~1–2 minutes.

**That's your backend.** From now on you manage homes entirely at pagescms.org —
no files, no code. Bookmark it. (Tip: you can add it to your phone's home
screen and manage listings from your phone.)

---

## Part 3 — Make the contact form work (Formspree)

Both forms (Contact + Home-Value/CMA) are ready for Formspree. Until it's
connected they fall back to opening the visitor's email app — set this up so
leads land in your inbox reliably (~10 min):

1. Sign up at **https://formspree.io** with the email where you want leads.
2. **Verify** that email (click Formspree's link).
3. **+ New Form**, name it "Spilo Website", copy the endpoint —
   `https://formspree.io/f/abcdwxyz`.
4. Open **`app.js`** in the repo, find near line 20:
   ```js
   var LEAD_ENDPOINT = '';
   ```
   and paste your endpoint:
   ```js
   var LEAD_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
   ```
   Commit the change (GitHub Pages redeploys).
5. Submit each form once on the live site, click Formspree's one-time confirm
   email, then test again — the lead should arrive.

Notes: forms already include spam **honeypots** (`_gotcha` / `company_website`).
Free tier = 50 submissions/month, plenty here.

---

## Part 4 — Fill these in before you promote it (placeholders)

The only "demo" leftovers. Tell me the real values and I'll set them, or edit
the files and re-commit:

| What | Where | Current placeholder |
|------|-------|---------------------|
| **Phone** | footer of every page + contact page | `(215) 859-3267` — a **Philadelphia** area code; needs your real (208) number |
| **Office address** | footer of every page + contact page | `[Office address: add before publishing]` |
| **Email** | footer + contact page | `johnspilotros@kw.com` — confirm it's live |
| **Headshot** | about.html | a "JS" monogram + "Add your headshot here" |
| **Bio** | about.html "My story" | I drafted one around your web/marketing background — review and make it yours |

---

## Two important real-world notes

- **KW Boise approval:** Most Keller Williams Market Centers have rules about
  agents running their own sites (branding, required disclaimers, sometimes
  pre-approval). Confirm with your Market Center before promoting it, and that
  `Keller Williams Boise` is the exact licensed brokerage name to display.
- **MLS / IMLS:** This site shows **your own** listings (entered in the admin).
  It is **not** wired into Intermountain MLS — a hand-built site can't be; a full
  MLS/IDX feed needs MLS membership, broker authorization, and an approved IDX
  vendor (~$50–80/mo), or the IDX that already comes with KW Command / kw.com.
  For a brand-new agent, manage your own listings here and use KW's IDX for full
  MLS search. Revisit a paid IDX vendor later if you want branded MLS search on
  spilo.xyz.

---

## Custom domain note
GitHub Pages stores your custom domain in a `CNAME` file (containing `spilo.xyz`)
that it creates when you set the domain under **repo Settings → Pages → Custom
domain**. Since spilo.xyz already works, that's done — just don't delete that
`CNAME` file when uploading.
