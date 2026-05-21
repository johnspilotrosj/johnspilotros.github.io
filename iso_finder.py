#!/usr/bin/env python3
"""
ISO FINDER  --  scans Reddit + Craigslist for people asking for your services
and saves new matches to iso_leads.csv. Run it whenever you like; it only
reports posts it hasn't shown you before.

WHAT IT CAN AND CAN'T DO
  - It CAN read Reddit (official API) and Craigslist (public RSS). Both are allowed.
  - It CANNOT read Facebook or Nextdoor -- they have no API and ban scraping.
    Use the notification setup in marketing/ISO-ALERTS.md for those.

----------------------------------------------------------------------------
ONE-TIME SETUP (about 5 minutes)
----------------------------------------------------------------------------
1. Install the two libraries (open a terminal in this folder and run):
       pip install praw feedparser

2. Get free Reddit API keys (only needed for the Reddit part):
   - Go to  https://www.reddit.com/prefs/apps
   - Click "create another app...", choose type "script"
   - name: iso-finder   redirect uri: http://localhost:8080
   - After creating, copy the client id (under the app name) and the secret.
   - Paste them into the REDDIT_* lines below.
   (If you skip this, the script still runs Craigslist -- it just skips Reddit.)

3. Run it:
       python iso_finder.py
   New leads print to the screen AND get saved to iso_leads.csv.

4. (Optional) Make it run by itself: Windows Task Scheduler -> Create Basic Task
   -> Daily/Hourly -> Action "Start a program" -> program: python
   -> arguments: the full path to this file.
----------------------------------------------------------------------------
"""

import csv
import json
import os
import re
from datetime import datetime

# ----------------------- CONFIG: edit these -------------------------------

# Reddit API keys (from step 2). Leave blank to skip Reddit.
REDDIT_CLIENT_ID = ""
REDDIT_CLIENT_SECRET = ""
REDDIT_USER_AGENT = "iso-finder by /u/yourusername"

# Subreddits to watch (no "r/").
SUBREDDITS = ["Boise", "Idaho", "treasurevalley", "Meridian", "Nampa"]

# Craigslist RSS feeds (Boise). lbg = labor gigs, ggg = all gigs.
CRAIGSLIST_FEEDS = [
    "https://boise.craigslist.org/search/lbg?format=rss",
    "https://boise.craigslist.org/search/ggg?query=junk&format=rss",
    "https://boise.craigslist.org/search/ggg?query=haul&format=rss",
    "https://boise.craigslist.org/search/ggg?query=yard&format=rss",
    "https://boise.craigslist.org/search/ggg?query=landscaping&format=rss",
    "https://boise.craigslist.org/search/ggg?query=pressure+washing&format=rss",
]

# Words/phrases that signal someone wants your services.
KEYWORDS = [
    "junk removal", "junk hauling", "haul away", "hauling", "dump run",
    "cleanout", "clean out", "furniture removal", "appliance removal",
    "mattress removal", "debris removal",
    "power wash", "powerwash", "pressure wash", "driveway cleaning",
    "house washing",
    "dryer vent", "dryer not drying", "dryer takes",
    "landscaper", "landscaping", "yard cleanup", "yard work", "lawn care",
    "mowing", "mulch", "weeding", "brush removal", "sod",
    # intent phrases (catch asks even without a service word)
    "iso", "in search of", "anyone know", "recommendation", "recommendations",
    "looking for someone", "need someone to", "who do you use",
]

OUTPUT_CSV = "iso_leads.csv"
SEEN_FILE = "iso_seen.json"   # remembers what it already showed you

# --------------------------------------------------------------------------


def load_seen():
    if os.path.exists(SEEN_FILE):
        try:
            return set(json.load(open(SEEN_FILE, encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_seen(seen):
    json.dump(sorted(seen), open(SEEN_FILE, "w", encoding="utf-8"))


def matched_keyword(text):
    text = (text or "").lower()
    for kw in KEYWORDS:
        # word-ish boundary so "iso" doesn't match "poison"
        if re.search(r"(?<![a-z])" + re.escape(kw) + r"(?![a-z])", text):
            return kw
    return None


def append_rows(rows):
    new_file = not os.path.exists(OUTPUT_CSV)
    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new_file:
            w.writerow(["found_on", "source", "keyword", "title", "url"])
        w.writerows(rows)


def scan_reddit(seen):
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        print("  (Reddit skipped -- add API keys in CONFIG to enable.)")
        return []
    try:
        import praw
    except ImportError:
        print("  (Reddit skipped -- run: pip install praw)")
        return []

    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )
    rows = []
    for sub in SUBREDDITS:
        try:
            for post in reddit.subreddit(sub).new(limit=40):
                if post.id in seen:
                    continue
                kw = matched_keyword(post.title) or matched_keyword(getattr(post, "selftext", ""))
                if kw:
                    rows.append([
                        datetime.now().strftime("%Y-%m-%d %H:%M"),
                        f"reddit/r/{sub}", kw, post.title.strip(),
                        "https://reddit.com" + post.permalink,
                    ])
                seen.add(post.id)
        except Exception as e:
            print(f"  (couldn't read r/{sub}: {e})")
    return rows


def scan_craigslist(seen):
    try:
        import feedparser
    except ImportError:
        print("  (Craigslist skipped -- run: pip install feedparser)")
        return []

    browser_ua = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
    rows = []
    for url in CRAIGSLIST_FEEDS:
        feed = feedparser.parse(url, agent=browser_ua)
        status = getattr(feed, "status", None)
        if status == 403:
            print("  (Craigslist blocked this network with 403 — this is common from "
                  "some connections. Try from home, or use the RSS reader method in "
                  "marketing/ISO-ALERTS.md. Reddit results below are unaffected.)")
            break
        for entry in feed.entries:
            uid = entry.get("id") or entry.get("link")
            if not uid or uid in seen:
                continue
            text = entry.get("title", "") + " " + entry.get("summary", "")
            kw = matched_keyword(text)
            if kw:
                rows.append([
                    datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "craigslist", kw, entry.get("title", "").strip(),
                    entry.get("link", ""),
                ])
            seen.add(uid)
    return rows


def main():
    print("ISO FINDER — scanning...")
    seen = load_seen()
    rows = []
    print("- Reddit:")
    rows += scan_reddit(seen)
    print("- Craigslist:")
    rows += scan_craigslist(seen)
    save_seen(seen)

    if rows:
        append_rows(rows)
        print(f"\n{len(rows)} NEW lead(s) found — saved to {OUTPUT_CSV}:\n")
        for r in rows:
            print(f"  [{r[1]}] ({r[2]}) {r[3]}\n      {r[4]}")
    else:
        print("\nNo new matching posts this run. Try again later.")


if __name__ == "__main__":
    main()
