#!/usr/bin/env python3
"""
WEB LEADS FINDER  --  finds local Treasure Valley businesses you could pitch
website work to, grabs their public phone + email, scores how likely each one
is to actually PICK UP the phone, and saves them to web_leads.csv (best first).

WHO THIS IS FOR
  You build websites. The best prospects are businesses that have NO website
  (or only a Facebook page) and that actually answer their phone. This tool
  finds them and sorts them so you call the likeliest answers first.

WHERE THE DATA COMES FROM
  - Business list: OpenStreetMap (open public data, free, no signup, allowed).
  - Emails: pulled from each business's OWN website (the info@/contact@ address
    they publish publicly). No scraping of Google/Yelp/Facebook.

WHAT IT CAN AND CAN'T DO
  - It CAN run with zero setup -- only uses Python's built-in libraries.
  - It CANNOT see Google review counts or "verified" status (that needs the
    paid Google Places API). The pickup score uses what OpenStreetMap exposes:
    whether a phone is listed, whether they have a website, and whether they
    list opening hours. It's an educated ranking, not a real-world percentage.

----------------------------------------------------------------------------
HOW TO RUN (no install needed)
----------------------------------------------------------------------------
1. Open a terminal in this folder and run:
       python web_leads_finder.py
2. New leads print to the screen AND save to web_leads.csv, best score first.
3. To change what you search for or where, edit the CONFIG section below.
----------------------------------------------------------------------------
"""

import csv
import json
import os
import re
import socket
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

# ----------------------- CONFIG: edit these -------------------------------

# Treasure Valley bounding box (south, west, north, east).
# Covers Boise, Meridian, Nampa, Caldwell, Eagle, Kuna, Star.
BBOX = (43.45, -116.75, 43.75, -116.18)

# Business types to look for. These are OpenStreetMap "tags".
# Add or remove freely. Format: ("key", "value"). Use value "*" for any.
BUSINESS_TYPES = [
    ("shop", "*"),            # stores of all kinds
    ("craft", "*"),           # plumbers, electricians, hvac, carpenters, etc.
    ("office", "company"),
    ("amenity", "restaurant"),
    ("amenity", "cafe"),
    ("amenity", "bar"),
    ("amenity", "veterinary"),
    ("amenity", "dentist"),
    ("shop", "hairdresser"),
    ("shop", "beauty"),
]

# How many businesses to keep per run (after scoring). Keeps the list usable.
MAX_LEADS = 150

# How many websites to visit at once when looking for emails. Higher = faster.
EMAIL_WORKERS = 12

# Only keep leads with a phone number (you can't call what isn't listed).
REQUIRE_PHONE = True

# LIVENESS FILTERS -- these fight "dead number" leads.
# Require the business to list opening hours (closed/abandoned listings rarely do).
REQUIRE_HOURS = True
# Drop businesses whose OpenStreetMap entry hasn't been edited in this many years.
# A stale map entry is the #1 cause of disconnected numbers. Lower = stricter.
MAX_EDIT_AGE_YEARS = 4

OUTPUT_CSV = "web_leads.csv"
SEEN_FILE = "web_leads_seen.json"   # remembers businesses already saved

# --------------------------------------------------------------------------

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# email shapes we never want (tracking pixels, image files, placeholders)
EMAIL_JUNK = ("example.com", "sentry", "wixpress", "@2x", ".png", ".jpg",
              ".jpeg", ".gif", ".svg", "@sentry", "domain.com", "email.com",
              "yourdomain", "u003e", "schema.org", ".css", ".js", ".webp",
              ".ico", "@x", "core-js", "react", "@babel")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            return set(json.load(open(SEEN_FILE, encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_seen(seen):
    json.dump(sorted(seen), open(SEEN_FILE, "w", encoding="utf-8"))


def build_overpass_query():
    s, w, n, e = BBOX
    parts = []
    for key, val in BUSINESS_TYPES:
        if val == "*":
            sel = f'["{key}"]["name"]'
        else:
            sel = f'["{key}"="{val}"]["name"]'
        # nodes and ways (buildings) both can be businesses
        parts.append(f"  node{sel}({s},{w},{n},{e});")
        parts.append(f"  way{sel}({s},{w},{n},{e});")
    body = "\n".join(parts)
    # "meta" gives us each entry's last-edited timestamp (for the liveness filter)
    return f"[out:json][timeout:60];\n(\n{body}\n);\nout center meta tags;"


def fetch_overpass():
    query = build_overpass_query()
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={
        "User-Agent": "web-leads-finder/1.0 (local business prospecting tool)",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.load(r).get("elements", [])
    except urllib.error.HTTPError as ex:
        if ex.code == 429:
            print("  (OpenStreetMap is rate-limiting -- wait a minute and re-run.)")
        else:
            print(f"  (OpenStreetMap error {ex.code}. Try again shortly.)")
        return []
    except Exception as ex:
        print(f"  (Couldn't reach OpenStreetMap: {ex})")
        return []


def find_email(website):
    """Visit a business website and return the first real email we can find."""
    if not website:
        return ""
    if not website.startswith("http"):
        website = "http://" + website
    pages = [website, website.rstrip("/") + "/contact", website.rstrip("/") + "/contact-us"]
    for url in pages:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=6) as r:
                html = r.read(300_000).decode("utf-8", "ignore")
        except Exception:
            continue
        # prefer explicit mailto: links, then any address in the text
        candidates = re.findall(r'mailto:([^"\'?>\s]+)', html) + EMAIL_RE.findall(html)
        for c in candidates:
            c = c.strip().lower()
            if any(j in c for j in EMAIL_JUNK):
                continue
            return c
    return ""


def edit_age_years(el):
    """How many years since this OpenStreetMap entry was last edited. None if unknown."""
    ts = el.get("timestamp")  # e.g. "2023-04-18T09:12:33Z"
    if not ts:
        return None
    try:
        when = datetime.strptime(ts[:10], "%Y-%m-%d")
        return (datetime.now() - when).days / 365.25
    except Exception:
        return None


def looks_like_facebook_only(tags):
    site = tags.get("website") or tags.get("contact:website") or ""
    fb = tags.get("contact:facebook") or tags.get("facebook") or ""
    if not site and fb:
        return True
    return "facebook.com" in site.lower()


def pickup_score(tags, age):
    """
    Educated 0-100 ranking of how likely the business is still ALIVE and will
    answer. NOT a real percentage -- a way to sort the call list, higher first.
    Built from OpenStreetMap liveness signals only. The biggest factor is how
    recently the map entry was edited, because a stale entry is the main reason
    a listed number is dead.
    """
    score = 35
    notes = []

    # --- freshness: the strongest signal we have that the business still exists
    if age is None:
        notes.append("edit date unknown")
    elif age <= 1:
        score += 30
        notes.append("map entry updated this year")
    elif age <= 2:
        score += 20
        notes.append("updated within 2yr")
    elif age <= 4:
        score += 8
        notes.append("updated within 4yr")
    else:
        score -= 10
        notes.append("stale map entry (number may be dead)")

    if tags.get("opening_hours"):
        score += 15
        notes.append("hours listed")

    # small operators (no chain/brand tag) tend to answer their own cell
    if not (tags.get("brand") or tags.get("operator")):
        score += 8
        notes.append("looks independent")

    phone = tags.get("phone") or tags.get("contact:phone") or ""
    if re.search(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", phone):
        score += 5

    return max(0, min(100, score)), "; ".join(notes)


def is_web_pitch(tags):
    """True if this business has no real website -- a candidate for your services."""
    site = tags.get("website") or tags.get("contact:website") or ""
    return (not site) or looks_like_facebook_only(tags)


def address_of(tags):
    parts = [tags.get("addr:housenumber", ""), tags.get("addr:street", ""),
             tags.get("addr:city", "")]
    return " ".join(p for p in parts if p).strip()


def main():
    print("WEB LEADS FINDER -- searching Treasure Valley businesses...")
    seen = load_seen()
    elements = fetch_overpass()
    if not elements:
        print("No data returned this run.")
        return

    rows = []
    print(f"- Found {len(elements)} candidates. Scoring...")
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name:
            continue
        phone = (tags.get("phone") or tags.get("contact:phone") or "").strip()
        if REQUIRE_PHONE and not phone:
            continue

        # --- liveness filters: cut the dead-number leads before they reach you
        if REQUIRE_HOURS and not tags.get("opening_hours"):
            continue
        age = edit_age_years(el)
        if age is not None and age > MAX_EDIT_AGE_YEARS:
            continue

        # dedupe across runs by OSM id
        uid = f"{el.get('type')}/{el.get('id')}"
        if uid in seen:
            continue
        seen.add(uid)

        site = (tags.get("website") or tags.get("contact:website") or "").strip()
        score, why = pickup_score(tags, age)

        rows.append({
            "pickup_score": score,
            "name": name,
            "phone": phone,
            "email": "",
            "web_pitch": "YES" if is_web_pitch(tags) else "",
            "website": site or "NO WEBSITE",
            "_site": site,
            "address": address_of(tags),
            "why": why,
            "osm": f"https://www.openstreetmap.org/{uid}",
            "found_on": datetime.now().strftime("%Y-%m-%d %H:%M"),
        })

    save_seen(seen)

    if not rows:
        print("\nNo new businesses this run (already saved earlier, or none matched).")
        return

    # rank first, then only chase emails for the leads we're actually keeping
    rows.sort(key=lambda r: r["pickup_score"], reverse=True)
    rows = rows[:MAX_LEADS]

    with_sites = [r for r in rows if r["_site"]]
    if with_sites:
        print(f"- Pulling emails from {len(with_sites)} websites "
              f"({EMAIL_WORKERS} at a time)...")
        with ThreadPoolExecutor(max_workers=EMAIL_WORKERS) as pool:
            emails = pool.map(find_email, [r["_site"] for r in with_sites])
        for r, email in zip(with_sites, emails):
            r["email"] = email
    for r in rows:
        r.pop("_site", None)

    fields = ["pickup_score", "name", "phone", "email", "web_pitch", "website",
              "address", "why", "osm", "found_on"]
    new_file = not os.path.exists(OUTPUT_CSV)
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        if new_file:
            w.writeheader()
        w.writerows(rows)

    print(f"\n{len(rows)} NEW lead(s) saved to {OUTPUT_CSV} (best first):\n")
    for r in rows[:15]:
        print(f"  [{r['pickup_score']:>3}] {r['name']}  {r['phone']}  "
              f"{r['email'] or '(no email)'}  -- {r['website']}")
    if len(rows) > 15:
        print(f"  ...and {len(rows) - 15} more in {OUTPUT_CSV}")


if __name__ == "__main__":
    socket.setdefaulttimeout(90)
    main()
