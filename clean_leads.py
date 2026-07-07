#!/usr/bin/env python3
"""
CLEAN LEADS -- turns the raw email_leads.csv into a send-ready list.

It removes the things that hurt you:
  - addresses that already BOUNCED (confirmed dead)
  - junk/placeholder scrapes (test@test.com, info@mysite.com, noreply@, etc.)
  - emails scraped off the wrong site (web-agency / font-vendor domains)
  - national chains & franchises (they won't hire a local web guy)
and FLAGS (keeps, but marks) addresses most likely to bounce next
(ancient ISP mailboxes like qwest/mindspring) so you can verify them first.

Output: email_leads_clean.csv   (columns: email,name,category,city,phone,website,risk)
Run:    python clean_leads.py
"""

import csv
import re

IN = "email_leads.csv"
OUT = "email_leads_clean.csv"

# --- confirmed dead (bounced "address not found" on send) -------------------
BOUNCED = {
    "nthewarmingtrend@live.com", "cameron@clairvoyantbrewing.com",
    "beer@westercollective.beer", "contact@levesquelaw.com",
    "topgum@mindspring.com",
}

# --- junk / placeholder / system addresses (substring match) ----------------
JUNK = [
    "test@test", "sample@test", "@mysite.com", "@mystore.com", "@mailservice.com",
    "do-not-reply", "donotreply", "noreply", "no-reply", "filler@", "godaddy",
    "wixpress", "sentry", "latofonts", "example.com", "mychartsupport", "bugreport@",
]

# --- wrong-site scrapes (the email belongs to a vendor/agency, not the biz) --
MISMATCH = {
    "info@iphoverland.com", "astigma@astigmatic.com", "eben@eyebytes.com",
    "sebastian@aldusleaf.org", "hello@cotswoldweb.co.uk", "bugs@choosereach.com",
    "info@ndiscovered.com", "pza@ktw.qpl",
}

# --- national chains / franchises / corporate (domain substring) ------------
CHAINS = [
    "chipotle.com", "theupsstore.com", "goodwill.org", "michaels.com", "dsw",
    "riteaid.com", "victra.com", "crumbl", "papamurphys.com", "sportclips.com",
    "pendleton", "barre3.com", "clubpilates.com", "tropicalsmoothie.com",
    "redrobin.com", "naturalgrocers.com", "waxcenter.com", "saloncentric.com",
    "fleetfeet", "bbsi.com", "rate.com", "roberthalf", "hotworx.net",
    "buffalowildwings.com", "lifetime.com", "containers.com", "iwantproof.com",
    "countryinn.com", "eidebailly.com", "denodo.com", "usbr.gov", "idaho.gov",
    "nsd131.org", "idsba.org", "slhs.org", "bcfranchise.com", "costavida.com",
    "moatable.com", "checkngo.com", "libertytax.com", "penwool.com", "anyhour.com",
    "epic-fb.com", "f45training.com", "haircutsarefun.com", "solasalonstudios",
    "moxiworks.com", "brookfieldproperties.com", "@kw.com", "cwan.com",
    "clearwater-analytics", "rushenterprises", "drinkfiiz.com",
]

# --- keep, but flag: ancient ISP mailboxes most likely to be dead -----------
RISKY = ["qwest.net", "qwestoffice.net", "mindspring.com", "aol.com", "@live.com"]

VALID = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")


def reason_to_drop(email):
    e = email.strip().lower().rstrip("\\")  # strip stray trailing backslash
    if not VALID.match(e):
        return "invalid format"
    if e in BOUNCED:
        return "bounced (dead)"
    if e in MISMATCH:
        return "wrong-site scrape"
    if any(j in e for j in JUNK):
        return "junk/placeholder"
    if any(c in e for c in CHAINS):
        return "national chain/corporate"
    return None


def main():
    kept, dropped, flagged = [], {}, 0
    seen = set()
    with open(IN, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            email = (row.get("email") or "").strip().rstrip("\\").lower()
            why = reason_to_drop(email)
            if why:
                dropped[why] = dropped.get(why, 0) + 1
                continue
            if email in seen:
                dropped["duplicate"] = dropped.get("duplicate", 0) + 1
                continue
            seen.add(email)
            risk = "verify (old ISP)" if any(r in email for r in RISKY) else ""
            if risk:
                flagged += 1
            kept.append({
                "email": email, "name": row.get("name", ""),
                "category": row.get("category", ""), "city": row.get("city", ""),
                "phone": row.get("phone", ""), "website": row.get("website", ""),
                "risk": risk,
            })

    kept.sort(key=lambda r: (r["risk"] != "", r["category"], r["name"]))
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["email", "name", "category", "city",
                                          "phone", "website", "risk"])
        w.writeheader()
        w.writerows(kept)

    print(f"Read {sum(dropped.values()) + len(kept)} rows from {IN}")
    print(f"\nREMOVED:")
    for why, n in sorted(dropped.items(), key=lambda x: -x[1]):
        print(f"  {n:>4}  {why}")
    print(f"\nKEPT: {len(kept)} send-ready leads  ->  {OUT}")
    print(f"  of those, {flagged} flagged 'verify (old ISP)' (verify before sending)")
    print(f"  clean/low-risk: {len(kept) - flagged}")


if __name__ == "__main__":
    main()
