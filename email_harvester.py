#!/usr/bin/env python3
"""
EMAIL HARVESTER -- pulls as many real, emailable Treasure Valley businesses as
possible so you can pitch them web work. Two email sources:

  1. OpenStreetMap's own email / contact:email tags (free, no scraping).
  2. Scraping each business's website (homepage + /contact + /about) for the
     address they publish publicly.

Output: email_leads.csv  (one row per UNIQUE email, best/most-reliable first).
Columns: email, name, category, city, phone, website, source

No paid APIs, only Python's standard library. Run:  python email_harvester.py
"""

import csv
import json
import re
import socket
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

# ---- area: Treasure Valley (Boise, Meridian, Nampa, Caldwell, Eagle, Kuna, Star, Middleton)
BBOX = (43.42, -116.82, 43.80, -116.08)

# ---- business types to pull (broad on purpose -- we want volume)
BUSINESS_TYPES = [
    ("shop", "*"), ("craft", "*"), ("office", "*"),
    ("amenity", "restaurant"), ("amenity", "cafe"), ("amenity", "bar"),
    ("amenity", "pub"), ("amenity", "fast_food"), ("amenity", "veterinary"),
    ("amenity", "dentist"), ("amenity", "doctors"), ("amenity", "clinic"),
    ("amenity", "pharmacy"), ("leisure", "fitness_centre"), ("tourism", "hotel"),
]

SCRAPE_CAP = 800          # max websites to scrape per run (keeps runtime sane)
EMAIL_WORKERS = 24        # how many sites to fetch at once
OUTPUT_CSV = "email_leads.csv"

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

EMAIL_JUNK = ("example.com", "sentry", "wixpress", "@2x", ".png", ".jpg",
              ".jpeg", ".gif", ".svg", "@sentry", "domain.com", "email.com",
              "yourdomain", "u003e", "schema.org", ".css", ".js", ".webp",
              ".ico", "@x", "core-js", "react", "@babel", "latofonts",
              "godaddy.com", "noreply", "no-reply", "donotreply", "wix.com",
              "squarespace", "shopify", "godaddy", "sentry.io", "cloudflare",
              "wordpress", "@adobe", "@google", "@facebook", "bcfranchise")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

CATEGORY = {
    ("amenity", "restaurant"): "restaurant", ("amenity", "fast_food"): "restaurant",
    ("amenity", "cafe"): "cafe", ("amenity", "bar"): "bar", ("amenity", "pub"): "bar",
    ("amenity", "veterinary"): "vet clinic", ("amenity", "dentist"): "dental office",
    ("amenity", "doctors"): "clinic", ("amenity", "clinic"): "clinic",
    ("amenity", "pharmacy"): "pharmacy", ("leisure", "fitness_centre"): "gym",
    ("tourism", "hotel"): "hotel", ("shop", "hairdresser"): "salon",
    ("shop", "beauty"): "spa", ("shop", "car_repair"): "auto shop",
    ("shop", "bakery"): "bakery", ("shop", "florist"): "florist",
    ("shop", "jewelry"): "jewelry store", ("shop", "clothes"): "clothing store",
    ("shop", "furniture"): "furniture store", ("shop", "car"): "dealership",
    ("shop", "hardware"): "hardware store", ("shop", "pet"): "pet store",
    ("office", "company"): "business",
}
CRAFT_LABEL = {"plumber": "plumbing company", "electrician": "electrical company",
               "hvac": "HVAC company", "carpenter": "carpentry business",
               "painter": "painting company", "roofer": "roofing company",
               "gardener": "landscaping company"}


def category_of(tags):
    for k in ("amenity", "leisure", "tourism", "shop", "office"):
        v = tags.get(k)
        if v and (k, v) in CATEGORY:
            return CATEGORY[(k, v)]
    if tags.get("craft"):
        return CRAFT_LABEL.get(tags["craft"], f"{tags['craft']} business")
    if tags.get("shop"):
        return "shop"
    if tags.get("office"):
        return "business"
    return "business"


def build_query():
    s, w, n, e = BBOX
    parts = []
    for key, val in BUSINESS_TYPES:
        sel = f'["{key}"]["name"]' if val == "*" else f'["{key}"="{val}"]["name"]'
        parts.append(f"  node{sel}({s},{w},{n},{e});")
        parts.append(f"  way{sel}({s},{w},{n},{e});")
    body = "\n".join(parts)
    return f"[out:json][timeout:90];\n(\n{body}\n);\nout center tags;"


def fetch_overpass():
    data = urllib.parse.urlencode({"data": build_query()}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={
        "User-Agent": "email-harvester/1.0 (local business prospecting)",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r).get("elements", [])
    except urllib.error.HTTPError as ex:
        print(f"  (OpenStreetMap error {ex.code} -- wait a minute and re-run.)")
        return []
    except Exception as ex:
        print(f"  (Couldn't reach OpenStreetMap: {ex})")
        return []


def clean_email(c):
    c = c.strip().lower().rstrip(".,;)")
    if not c or "@" not in c:
        return ""
    if any(j in c for j in EMAIL_JUNK):
        return ""
    if len(c) > 60:
        return ""
    return c


def scrape_email(website):
    if not website:
        return ""
    if not website.startswith("http"):
        website = "http://" + website
    base = website.rstrip("/")
    for url in (website, base + "/contact", base + "/contact-us", base + "/about"):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=6) as r:
                html = r.read(400_000).decode("utf-8", "ignore")
        except Exception:
            continue
        for c in re.findall(r'mailto:([^"\'?>\s]+)', html) + EMAIL_RE.findall(html):
            e = clean_email(c)
            if e:
                return e
    return ""


def main():
    print("EMAIL HARVESTER -- pulling Treasure Valley businesses from OpenStreetMap...")
    els = fetch_overpass()
    if not els:
        print("No data this run.")
        return
    print(f"- {len(els)} businesses found. Reading direct email tags...")

    biz = []          # businesses needing a website scrape
    rows = []         # finished rows (email already known from tag)
    for el in els:
        t = el.get("tags", {})
        name = (t.get("name") or "").strip()
        if not name:
            continue
        site = (t.get("website") or t.get("contact:website") or "").strip()
        tag_email = clean_email(t.get("email") or t.get("contact:email") or "")
        rec = {
            "email": tag_email, "name": name, "category": category_of(t),
            "city": (t.get("addr:city") or "").strip(),
            "phone": (t.get("phone") or t.get("contact:phone") or "").strip(),
            "website": site, "source": "osm-tag" if tag_email else "",
        }
        if tag_email:
            rows.append(rec)
        elif site and "facebook.com" not in site.lower() and "instagram" not in site.lower():
            biz.append(rec)

    print(f"- {len(rows)} had an email on file. Scraping up to {min(len(biz), SCRAPE_CAP)} "
          f"websites for the rest ({EMAIL_WORKERS} at a time)...")
    biz = biz[:SCRAPE_CAP]
    with ThreadPoolExecutor(max_workers=EMAIL_WORKERS) as pool:
        found = list(pool.map(scrape_email, [b["website"] for b in biz]))
    for b, em in zip(biz, found):
        if em:
            b["email"] = em
            b["source"] = "scraped"
            rows.append(b)

    # dedupe by email, keep osm-tag source first (more reliable)
    rows.sort(key=lambda r: 0 if r["source"] == "osm-tag" else 1)
    seen, unique = set(), []
    for r in rows:
        if r["email"] in seen:
            continue
        seen.add(r["email"])
        unique.append(r)

    fields = ["email", "name", "category", "city", "phone", "website", "source"]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(unique)

    print(f"\n*** {len(unique)} UNIQUE emailable businesses saved to {OUTPUT_CSV} ***")
    print(f"    ({sum(1 for r in unique if r['source']=='osm-tag')} from OSM tags, "
          f"{sum(1 for r in unique if r['source']=='scraped')} scraped)\n")
    for r in unique[:20]:
        print(f"  {r['email']:<38} {r['name']}  ({r['category']})")
    if len(unique) > 20:
        print(f"  ...and {len(unique) - 20} more in {OUTPUT_CSV}")


if __name__ == "__main__":
    socket.setdefaulttimeout(120)
    main()
