# Design

Two sibling sites, two themes:

- **`john-spilotros-realtor-react/` (current focus)** — theme **"Valley from above"**, documented in the *React site (v3)* section at the end of this file.
- **`john-spilotros-realtor/` (static original)** — theme **"Ponderosa pine & foothills clay at first light"**, documented below.

Visual system for **John Spilotros · Real Estate** (`john-spilotros-realtor/`). Captures the as-built system so future variants stay on-brand. Theme name: **"Ponderosa pine & foothills clay at first light."**

## Theme

Light, architectural, and grounded. A clean white surface lets a deep evergreen carry the brand, with a warm foothills-clay accent. Color strategy: **Committed** — evergreen owns the header, footer, hero overlays, and CTA bands (~30–50% of surface), white space carries the rest, clay is the single accent. Light mode only (no dark mode); the physical scene is a Treasure Valley home shown in clean daylight.

## Color (OKLCH)

| Role | Token | Value | Use |
|---|---|---|---|
| Background | `--bg` | `oklch(1 0 0)` | Pure white page surface |
| Surface | `--surface` | `oklch(0.978 0.004 168)` | Sections, cards, tool panels |
| Surface 2 | `--surface-2` | `oklch(0.958 0.006 168)` | Hover / nested fills |
| Primary | `--primary` | `oklch(0.345 0.078 163)` | Brand evergreen, buttons, links |
| Primary deep | `--primary-deep` | `oklch(0.235 0.052 165)` | Footer, hero/CTA drench |
| Primary bright | `--primary-bright` | `oklch(0.46 0.088 162)` | Button hover |
| On-primary | `--on-primary` | `oklch(0.97 0.012 150)` | Text on evergreen |
| Accent | `--accent` | `oklch(0.62 0.13 52)` | Foothills clay — CTAs, highlights, kicker rule |
| Accent deep | `--accent-deep` | `oklch(0.52 0.12 49)` | Links on light, accent hover |
| Accent wash | `--accent-wash` | `oklch(0.955 0.026 62)` | Success / soft clay backgrounds |
| Ink | `--ink` | `oklch(0.235 0.018 168)` | Body text (≈11:1 on white) |
| Muted | `--muted` | `oklch(0.455 0.018 168)` | Secondary text |
| Line | `--line` | `oklch(0.905 0.006 168)` | Hairline borders |

Text on saturated clay fills uses white (Helmholtz-Kohlrausch). Inline links use evergreen (`--primary`) with a clay underline for AA contrast; never raw clay on white for body links.

## Typography

- **Display:** `Hedvig Letters Serif` (Google Fonts), fallback `Iowan Old Style, Georgia, serif`. Used for h1–h4, the wordmark, prices/figures, and the signature. One weight; hierarchy comes from size.
- **Body / UI:** `Hanken Grotesk` (400/500/600/700), fallback `Segoe UI, system-ui, sans-serif`. Body, labels, nav, buttons.
- Pairing is on a **serif × grotesque contrast axis** — deliberately *not* the editorial-serif-italic lane. Neither family is on the AI reflex-reject list.
- Fluid modular scale via `clamp()`, ratio ≥ 1.25. Display ceiling 5rem (`--step-hero`); display letter-spacing −0.012em. `text-wrap: balance` on headings, `pretty` on prose. Prose capped at ~64ch.

## Layout & spacing

- Container `--maxw: 1240px`, fluid `--gutter` clamp(1.25rem, 5vw, 4rem), `--section` clamp(4rem, …, 7.5rem).
- Flex for 1D, grid for 2D. Responsive grids without breakpoints use `repeat(auto-fit, minmax(…, 1fr))`.
- Breakpoints: 980px (multi-col → 2-col), 760px (→ single col, mobile nav). No horizontal overflow at any width.
- "How I help" uses **hairline-separated columns, not cards** (avoids the identical-card-grid tell). Numbered markers appear **only** on the real Connect→Plan→Move→Close sequence.

## Components

Sticky blurred header with scroll state · evergreen brand mark (roofline + clay vertical) · image hero with evergreen gradient overlay + inline CMA hand-off field · honest value row · hairline help columns · interactive neighborhood explorer (tablist) · image/text split · numbered process steps · evergreen CTA band · mortgage estimator (range sliders, live result, localStorage) · CMA request + contact forms (native validation, success state, toast) · compliance footer (Equal Housing Opportunity logo, license badge, full disclaimer). Z-index is a named scale (`--z-header` … `--z-toast`).

## Motion

Easing `--ease-out: cubic-bezier(0.16,1,0.3,1)` (no bounce). Hero entrance is CSS-driven and staggered (never gates visibility). Section reveals via IntersectionObserver add `.is-in` to an already-visible default, with a 2.4s force-reveal safety net. Page navigation uses the View Transitions API over a cached client-side router. Every animation has a `prefers-reduced-motion: reduce` path (instant / crossfade).

## Build

Dependency-free static site: 4 HTML pages + `styles.css` + `app.js`. No framework, no build step; opens by double-click (router degrades to native navigation on `file://`, full cached experience over http). Fonts via Google Fonts `<link>`, imagery via verified Unsplash URLs.

---

# React site (v3) — "Valley from above"

Visual system for **`john-spilotros-realtor-react/`** (Vite + React 19, no router — one long scrolling page with anchor nav). Replaced the v2 dark "dusk" theme on 2026-07-06 at John's direction: no dark background, drone-video hero, more confident copy. Brief: clean / luxury / modern / confident / local / mobile-first.

## Theme

Porcelain-white field, charcoal structure, **muted gold** accent (`black-white-charcoal-gold` palette per John's brief, with charcoal — never pure black — carrying the dark roles). Soft warm shadows, squared corners, uppercase tracked buttons.

## Color (OKLCH)

| Role | Token | Value |
|---|---|---|
| Background / band / card | `--bg` / `--bg-alt` / `--card` | `oklch(0.975 0.004 90)` / `0.947 0.006 88` / `0.995 0.002 90` |
| Charcoal / deep | `--charcoal` / `--charcoal-deep` | `oklch(0.26 0.008 250)` / `0.21 0.008 250` (contact band, footer, hero scrim) |
| Gold / text-safe / soft / line | `--gold` / `--gold-deep` / `--gold-soft` / `--gold-line` | `oklch(0.68 0.075 85)` / `0.52 0.08 80` / `0.9 0.028 90` / `0.8 0.05 88` |
| Ink / muted | `--ink` / `--muted` | `oklch(0.25 0.01 250)` / `0.47 0.012 250` |
| On dark | `--ivory` / `--ivory-dim` | `oklch(0.955 0.006 90)` / `0.8 0.008 90` |

## Typography

**Italiana** (display: h1/h2, prices, phone number, step numerals, footer wordmark — hairline luxury serif, single weight) × **Archivo** 400–700 (body/UI). Buttons and nav are uppercase with 0.08–0.09em tracking.

## Signature moves

- **Drone-video hero** (`min-height: 100svh`): three Pexels clips crossfading city → suburb → farm at `playbackRate 0.55` (slow-mo), dual-buffer `<video>` elements, charcoal scrim, Unsplash poster fallback. Reduced motion ⇒ poster only; background tab at load ⇒ reel starts on first `visibilitychange`. Clip URLs in `HERO_CLIPS` (src/data/site.js), verified 2026-07-06.
- **Sticky glass nav**: transparent white-on-video at top ⇒ porcelain glass (blur 16px) with charcoal text after 40px scroll.
- **Section lineup (anchors)**: `#top` hero · `#search` filterable sample-home cards · `#neighborhoods` 7 area cards · `#buyers` 5 tap-to-expand step cards · `#sellers` Italiana ledger + "Thinking about selling?" prompt card · `#about` portrait + 3 pillars · `#contact` charcoal band + light form card.
- **prefill-contact event**: card/area CTAs dispatch `prefill-contact` (CustomEvent) → contact form message pre-fills and page scrolls there.
- **Compliance (IREC)**: sample homes carry a visible `Sample · not a listing` badge + footer sentence; EHO + license #1681619 + responsible-broker supervision + no-agency disclaimer in footer; no REALTOR® mark (NAR membership not yet active); neighborhood median prices are marked placeholders — never invent figures, listings, stats, or testimonials.

React Bits in use: SplitText (hero h1), Reveal, Magnet, SpotlightCard (buyer steps, gold spotlight), ClickSpark (`#b3924f`). CountUp/TiltedCard currently unused. **No CMA / home-value feature — John removed it twice (final call 7/7); do not re-add.** Approved brand logos from John pending; add to header/footer when supplied.
