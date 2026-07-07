#!/usr/bin/env python3
"""
MORE SMALL BUSINESSES -- finds NEW small/independent local businesses with an
email to pitch web work. Widens the search to the greater Treasure Valley +
outlying towns, skips chains/franchises, and skips anyone already in
email_leads.csv so every result is new.

Output: email_leads_more.csv  (email,name,category,city,phone,web_status,website,source)
Run:    python more_small_biz.py
"""

import csv, json, os, re, socket, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor

# Wider area: core Treasure Valley + Kuna/Melba, Marsing/Homedale/Parma/Wilder, Emmett
BBOX = (43.28, -117.12, 43.95, -115.98)
BUSINESS_TYPES = [
    ("shop", "*"), ("craft", "*"), ("office", "company"),
    ("amenity", "restaurant"), ("amenity", "cafe"), ("amenity", "bar"),
    ("amenity", "pub"), ("amenity", "fast_food"), ("amenity", "veterinary"),
    ("amenity", "dentist"), ("amenity", "doctors"), ("amenity", "clinic"),
    ("leisure", "fitness_centre"),
]
SCRAPE_CAP = 700
EMAIL_WORKERS = 20
OUTPUT_CSV = "email_leads_more.csv"
EXISTING = ("email_leads.csv", "email_leads_clean.csv", "no_site_leads.csv")
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

EMAIL_JUNK = ("example.com","sentry","wixpress","@2x",".png",".jpg",".jpeg",".gif",
    ".svg","domain.com","email.com","yourdomain","schema.org",".css",".js",".webp",
    ".ico","core-js","react","@babel","latofonts","godaddy.com","noreply","no-reply",
    "donotreply","sentry.io","test@test","mysite.com","mystore.com","mailservice",
    "wix.com","squarespace.com","cloudflare","sample@","mailchimp","@x.","u003e")
# chains / franchises / corporate / known marketing-vendor domains -> skip
CHAINS = ("chipotle","theupsstore","ups.com","goodwill","michaels","dsw","riteaid",
    "victra","crumbl","papamurphys","sportclips","pendleton","barre3","clubpilates",
    "tropicalsmoothie","redrobin","naturalgrocers","waxcenter","saloncentric","fleetfeet",
    "bbsi.com","rate.com","roberthalf","hotworx","buffalowildwings","lifetime.com",
    "containers.com","iwantproof","countryinn","eidebailly","denodo","drinkfiiz","anyhour",
    "f45training","haircutsarefun","solasalonstudios","moxiworks","brookfieldproperties",
    "@kw.com","weomedia","epic-fb","checkngo","libertytax","penwool","costavida","subway",
    "mcdonald","starbucks","dominos","pizzahut","jimmyjohn","jerseymike","greatclips",
    "supercuts","domino","kfc","tacobell","wendys","dennys","dutchbros","jamba","gnc",
    "anytimefitness","snapfitness","orangetheory","massageenvy","europeanwax")
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
VALID = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")
DIY = ("business.site","wixsite","weebly","blogspot","wordpress.com","square.site",
       "godaddysites","edan.io","toast.site","strikingly","webnode","jimdo","sites.google.com")

CATEGORY = {("amenity","restaurant"):"restaurant",("amenity","fast_food"):"restaurant",
    ("amenity","cafe"):"cafe",("amenity","bar"):"bar",("amenity","pub"):"bar",
    ("amenity","veterinary"):"vet clinic",("amenity","dentist"):"dental office",
    ("amenity","doctors"):"clinic",("amenity","clinic"):"clinic",("leisure","fitness_centre"):"gym",
    ("shop","hairdresser"):"salon",("shop","beauty"):"salon/spa",("shop","nails"):"nail salon",
    ("shop","car_repair"):"auto shop",("shop","bakery"):"bakery",("shop","florist"):"florist",
    ("shop","butcher"):"butcher",("shop","jewelry"):"jewelry store",("shop","clothes"):"clothing store",
    ("shop","hardware"):"hardware store",("shop","pet"):"pet store",("office","company"):"business"}
CRAFT = {"plumber":"plumbing company","electrician":"electrical company","hvac":"HVAC company",
    "carpenter":"carpentry","painter":"painting company","roofer":"roofing company",
    "gardener":"landscaping company","caterer":"catering"}

def cat_of(t):
    for k in ("amenity","leisure","shop","office"):
        v = t.get(k)
        if v and (k,v) in CATEGORY: return CATEGORY[(k,v)]
    if t.get("craft"): return CRAFT.get(t["craft"], f"{t['craft']} business")
    if t.get("shop"): return "shop"
    return "business"

def web_status(site):
    if not site: return "none"
    s = site.lower()
    if "facebook" in s or "fb.me" in s: return "facebook-only"
    if "instagram" in s: return "instagram-only"
    if any(x in s for x in DIY): return "DIY builder"
    if s.startswith("http://"): return "dated (not secure)"
    return "real"

def clean_email(c):
    c = c.strip().lower().rstrip(".,;)\\")
    if not c or not VALID.match(c) or len(c) > 60: return ""
    if any(j in c for j in EMAIL_JUNK): return ""
    if any(ch in c for ch in CHAINS): return ""
    return ""  if c.endswith(".gov") or c.endswith(".edu") else c

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

def load_existing():
    seen = set()
    for fn in EXISTING:
        if not os.path.exists(fn): continue
        try:
            for row in csv.DictReader(open(fn, encoding="utf-8")):
                for part in (row.get("email") or "").split(","):
                    part = part.strip().lower()
                    if part: seen.add(part)
        except Exception:
            pass
    return seen

def query():
    s,w,n,e = BBOX
    parts = []
    for k,v in BUSINESS_TYPES:
        sel = f'["{k}"]["name"]' if v=="*" else f'["{k}"="{v}"]["name"]'
        parts.append(f"  node{sel}({s},{w},{n},{e});")
        parts.append(f"  way{sel}({s},{w},{n},{e});")
    return f"[out:json][timeout:120];\n(\n{chr(10).join(parts)}\n);\nout center tags;"

def main():
    existing = load_existing()
    print(f"MORE SMALL BIZ -- {len(existing)} emails already known (will skip). Querying OSM...")
    data = urllib.parse.urlencode({"data": query()}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={
        "User-Agent":"more-small-biz/1.0","Content-Type":"application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=150) as r:
            els = json.load(r).get("elements", [])
    except Exception as ex:
        print(f"  (OSM error: {ex})"); return
    print(f"- {len(els)} businesses found. Skipping chains; finding new small ones with email...")

    rows, to_scrape, seen = [], [], set(existing)
    for el in els:
        t = el.get("tags", {})
        name = (t.get("name") or "").strip()
        if not name: continue
        if t.get("brand"):            # chain/franchise -> skip
            continue
        site = (t.get("website") or t.get("contact:website") or "").strip()
        rec = {"email": clean_email(t.get("email") or t.get("contact:email") or ""),
            "name": name, "category": cat_of(t), "city": (t.get("addr:city") or "").strip(),
            "phone": (t.get("phone") or t.get("contact:phone") or "").strip(),
            "web_status": web_status(site), "website": site or "(none)",
            "source": "osm-tag" if (t.get("email") or t.get("contact:email")) else ""}
        if rec["email"]:
            if rec["email"] in seen: continue
            seen.add(rec["email"]); rows.append(rec)
        elif site and rec["web_status"] not in ("facebook-only","instagram-only"):
            to_scrape.append(rec)

    to_scrape = to_scrape[:SCRAPE_CAP]
    print(f"- Scraping {len(to_scrape)} sites for emails...")
    with ThreadPoolExecutor(max_workers=EMAIL_WORKERS) as pool:
        found = list(pool.map(scrape, [r["website"] for r in to_scrape]))
    for r, e in zip(to_scrape, found):
        if e and e not in seen:
            seen.add(e); r["email"] = e; r["source"] = "scraped"; rows.append(r)

    rows.sort(key=lambda r: (r["web_status"]!="none", r["category"], r["name"]))
    with open(OUTPUT_CSV,"w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["email","name","category","city","phone","web_status","website","source"])
        w.writeheader(); w.writerows(rows)

    print(f"\n*** {len(rows)} NEW small-business leads saved to {OUTPUT_CSV} ***")
    print(f"   ({sum(1 for r in rows if r['source']=='osm-tag')} from OSM tags, "
          f"{sum(1 for r in rows if r['source']=='scraped')} scraped)\n")
    for r in rows[:25]:
        print(f"  [{r['web_status']:<18}] {r['email']:<34} {r['name']} ({r['category']}, {r['city'] or '?'})")
    if len(rows) > 25: print(f"  ...and {len(rows)-25} more in {OUTPUT_CSV}")

if __name__ == "__main__":
    socket.setdefaulttimeout(150)
    main()
