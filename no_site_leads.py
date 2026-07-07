#!/usr/bin/env python3
"""
NO-SITE / BAD-SITE LEAD FINDER
Finds Treasure Valley businesses that (a) have a usable EMAIL and (b) have
NO website or a POOR one (Facebook/Instagram-only, Wix/Squarespace/business.site
DIY builders, or an insecure http-only site). These are your real prospects —
people who actually need what you build. Anyone with a real, modern site is skipped.

Email comes from OpenStreetMap's own email tag (works even with no website), or
is scraped from the poor DIY site. Social-only and no-site businesses can't be
scraped, so they only appear if they published an email in OSM.

Output: no_site_leads.csv  (email,name,category,city,phone,web_status,website,source)
Run:    python no_site_leads.py
"""

import csv, json, re, socket, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

BBOX = (43.40, -116.98, 43.84, -116.02)   # generous Treasure Valley
BUSINESS_TYPES = [
    ("shop", "*"), ("craft", "*"), ("office", "*"),
    ("amenity", "restaurant"), ("amenity", "cafe"), ("amenity", "bar"),
    ("amenity", "pub"), ("amenity", "fast_food"), ("amenity", "veterinary"),
    ("amenity", "dentist"), ("amenity", "doctors"), ("amenity", "clinic"),
    ("amenity", "pharmacy"), ("amenity", "fuel"), ("leisure", "fitness_centre"),
]
EMAIL_WORKERS = 20
OUTPUT_CSV = "no_site_leads.csv"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

EMAIL_JUNK = ("example.com","sentry","wixpress","@2x",".png",".jpg",".jpeg",".gif",
    ".svg","domain.com","email.com","yourdomain","schema.org",".css",".js",".webp",
    ".ico","core-js","react","@babel","latofonts","godaddy.com","noreply","no-reply",
    "donotreply","sentry.io","test@test","mysite.com","mystore.com","mailservice")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
VALID = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")

# website URL patterns that mean "poor / DIY / weak" presence
DIY = ("business.site","wixsite","weebly","blogspot","wordpress.com","square.site",
       "godaddysites","edan.io","toast.site","strikingly","webnode","jimdo","tripod",
       "myshopify.com/password","sites.google.com")
SOCIAL_FB = ("facebook.com","fb.me","fb.com")
SOCIAL_IG = ("instagram.com",)

CATEGORY = {("amenity","restaurant"):"restaurant",("amenity","fast_food"):"restaurant",
    ("amenity","cafe"):"cafe",("amenity","bar"):"bar",("amenity","pub"):"bar",
    ("amenity","veterinary"):"vet clinic",("amenity","dentist"):"dental office",
    ("amenity","doctors"):"clinic",("amenity","clinic"):"clinic",
    ("amenity","pharmacy"):"pharmacy",("amenity","fuel"):"gas/convenience",
    ("leisure","fitness_centre"):"gym",("shop","hairdresser"):"salon",
    ("shop","beauty"):"salon/spa",("shop","nails"):"nail salon",
    ("shop","massage"):"massage",("shop","car_repair"):"auto shop",
    ("shop","bakery"):"bakery",("shop","florist"):"florist",("shop","butcher"):"butcher",
    ("shop","hardware"):"hardware store",("shop","pet"):"pet store",
    ("shop","tattoo"):"tattoo shop",("shop","car"):"dealership",("office","company"):"business"}
CRAFT = {"plumber":"plumbing company","electrician":"electrical company","hvac":"HVAC company",
    "carpenter":"carpentry","painter":"painting company","roofer":"roofing company",
    "gardener":"landscaping company","caterer":"catering"}

def cat_of(t):
    for k in ("amenity","leisure","shop","office"):
        v = t.get(k)
        if v and (k,v) in CATEGORY: return CATEGORY[(k,v)]
    if t.get("craft"): return CRAFT.get(t["craft"], f"{t['craft']} business")
    if t.get("shop"): return "shop"
    if t.get("office"): return "business"
    return "business"

def web_status(site):
    if not site: return "none"
    s = site.lower()
    if any(x in s for x in SOCIAL_FB): return "facebook-only"
    if any(x in s for x in SOCIAL_IG): return "instagram-only"
    if any(x in s for x in DIY): return "DIY builder"
    if s.startswith("http://"): return "dated (not secure)"
    return "real"

TIER = {"none":0,"facebook-only":1,"instagram-only":2,"DIY builder":3,"dated (not secure)":4}

def clean_email(c):
    c = c.strip().lower().rstrip(".,;)\\")
    if not c or not VALID.match(c): return ""
    if any(j in c for j in EMAIL_JUNK): return ""
    if len(c) > 60: return ""
    return c

def scrape(site):
    if not site.startswith("http"): site = "http://" + site
    base = site.rstrip("/")
    for url in (site, base+"/contact", base+"/contact-us", base+"/about"):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=6) as r:
                html = r.read(300_000).decode("utf-8","ignore")
        except Exception:
            continue
        for c in re.findall(r'mailto:([^"\'?>\s]+)', html) + EMAIL_RE.findall(html):
            e = clean_email(c)
            if e: return e
    return ""

def query():
    s,w,n,e = BBOX
    parts = []
    for k,v in BUSINESS_TYPES:
        sel = f'["{k}"]["name"]' if v=="*" else f'["{k}"="{v}"]["name"]'
        parts.append(f"  node{sel}({s},{w},{n},{e});")
        parts.append(f"  way{sel}({s},{w},{n},{e});")
    return f"[out:json][timeout:90];\n(\n{chr(10).join(parts)}\n);\nout center tags;"

def main():
    print("NO-SITE / BAD-SITE FINDER -- querying OpenStreetMap...")
    data = urllib.parse.urlencode({"data": query()}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={
        "User-Agent":"no-site-finder/1.0","Content-Type":"application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            els = json.load(r).get("elements", [])
    except Exception as ex:
        print(f"  (OSM error: {ex})"); return
    print(f"- {len(els)} businesses. Filtering to no-site / bad-site with an email...")

    rows, to_scrape = [], []
    for el in els:
        t = el.get("tags", {})
        name = (t.get("name") or "").strip()
        if not name: continue
        site = (t.get("website") or t.get("contact:website") or "").strip()
        ws = web_status(site)
        if ws == "real":            # has a real site -> NOT a prospect, skip
            continue
        rec = {"email": clean_email(t.get("email") or t.get("contact:email") or ""),
            "name": name, "category": cat_of(t), "city": (t.get("addr:city") or "").strip(),
            "phone": (t.get("phone") or t.get("contact:phone") or "").strip(),
            "web_status": ws, "website": site or "(none)",
            "source": "osm-tag" if (t.get("email") or t.get("contact:email")) else ""}
        if rec["email"]:
            rows.append(rec)
        elif ws in ("DIY builder", "dated (not secure)") and site:   # scrapeable poor site
            to_scrape.append(rec)

    if to_scrape:
        print(f"- Scraping {len(to_scrape)} weak sites for an email...")
        with ThreadPoolExecutor(max_workers=EMAIL_WORKERS) as pool:
            found = list(pool.map(scrape, [r["website"] for r in to_scrape]))
        for r, e in zip(to_scrape, found):
            if e: r["email"] = e; r["source"] = "scraped"; rows.append(r)

    seen, uniq = set(), []
    rows.sort(key=lambda r: (TIER.get(r["web_status"],9), r["category"], r["name"]))
    for r in rows:
        if r["email"] in seen: continue
        seen.add(r["email"]); uniq.append(r)

    with open(OUTPUT_CSV,"w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["email","name","category","city","phone","web_status","website","source"])
        w.writeheader(); w.writerows(uniq)

    from collections import Counter
    by = Counter(r["web_status"] for r in uniq)
    print(f"\n*** {len(uniq)} prospects saved to {OUTPUT_CSV} ***")
    for k in ("none","facebook-only","instagram-only","DIY builder","dated (not secure)"):
        if by.get(k): print(f"   {by[k]:>3}  {k}")
    print()
    for r in uniq[:25]:
        print(f"  [{r['web_status']:<18}] {r['email']:<34} {r['name']} ({r['category']})")
    if len(uniq) > 25: print(f"  ...and {len(uniq)-25} more in {OUTPUT_CSV}")

if __name__ == "__main__":
    socket.setdefaulttimeout(120)
    main()
