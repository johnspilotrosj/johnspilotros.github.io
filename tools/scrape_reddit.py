#!/usr/bin/env python3
"""Scrape Reddit posts and comments using OAuth2 app-only credentials."""

import argparse
import json
import os
import time

import requests

USER_AGENT = "boise-labor-leads/1.0 (by u/YOUR_REDDIT_USERNAME)"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", ".tmp", "reddit_posts.json")


def get_token(client_id, client_secret):
    resp = requests.post(
        "https://www.reddit.com/api/v1/access_token",
        auth=(client_id, client_secret),
        data={"grant_type": "client_credentials"},
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def make_session(token):
    s = requests.Session()
    s.headers.update({
        "Authorization": f"bearer {token}",
        "User-Agent": USER_AGENT,
    })
    return s


def fetch_posts(session, subreddit=None, query=None, limit=25):
    if query and subreddit:
        url = f"https://oauth.reddit.com/r/{subreddit}/search"
        params = {"q": query, "restrict_sr": 1, "sort": "new", "limit": min(limit, 100), "t": "month"}
    elif query:
        url = "https://oauth.reddit.com/search"
        params = {"q": query, "sort": "new", "limit": min(limit, 100), "t": "month"}
    else:
        url = f"https://oauth.reddit.com/r/{subreddit}/new"
        params = {"limit": min(limit, 100)}

    resp = session.get(url, params=params, timeout=15)
    resp.raise_for_status()
    children = resp.json().get("data", {}).get("children", [])
    posts = []
    for child in children:
        p = child.get("data", {})
        posts.append({
            "title": p.get("title"),
            "selftext": p.get("selftext") or None,
            "score": p.get("score"),
            "upvote_ratio": p.get("upvote_ratio"),
            "num_comments": p.get("num_comments"),
            "author": p.get("author"),
            "flair": p.get("link_flair_text"),
            "permalink": "https://www.reddit.com" + p.get("permalink", ""),
            "subreddit": p.get("subreddit"),
            "created_utc": p.get("created_utc"),
            "comments": [],
        })
    return posts


def fetch_comments(session, permalink):
    url = "https://oauth.reddit.com" + permalink.replace("https://www.reddit.com", "") + ".json"
    try:
        resp = session.get(url, params={"limit": 20, "depth": 2}, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        comments = []
        if len(data) < 2:
            return comments
        for child in data[1].get("data", {}).get("children", []):
            c = child.get("data", {})
            body = c.get("body")
            if body and body not in ("[deleted]", "[removed]"):
                comments.append({
                    "body": body,
                    "score": c.get("score"),
                    "author": c.get("author"),
                })
        return comments
    except Exception:
        return []


def main():
    parser = argparse.ArgumentParser(description="Scrape Reddit posts using OAuth2.")
    parser.add_argument("--client-id", default=os.environ.get("REDDIT_CLIENT_ID"), help="Reddit app client ID")
    parser.add_argument("--client-secret", default=os.environ.get("REDDIT_CLIENT_SECRET"), help="Reddit app client secret")
    parser.add_argument("--subreddit", help="Subreddit name without r/")
    parser.add_argument("--query", help="Search query")
    parser.add_argument("--limit", type=int, default=25, help="Max posts to fetch (default 25)")
    parser.add_argument("--comments", action="store_true", help="Fetch top comments per post")
    args = parser.parse_args()

    if not args.client_id or not args.client_secret:
        parser.error(
            "Reddit credentials required.\n"
            "  Option 1: export REDDIT_CLIENT_ID=xxx REDDIT_CLIENT_SECRET=yyy\n"
            "  Option 2: pass --client-id and --client-secret\n"
            "  Get free credentials at: https://www.reddit.com/prefs/apps"
        )
    if not args.subreddit and not args.query:
        parser.error("Provide at least --subreddit or --query")

    print("Authenticating with Reddit...")
    token = get_token(args.client_id, args.client_secret)
    session = make_session(token)
    print("  OK")

    print(f"Fetching up to {args.limit} posts...")
    posts = fetch_posts(session, subreddit=args.subreddit, query=args.query, limit=args.limit)
    print(f"  Got {len(posts)} posts")

    if args.comments:
        print("Fetching comments (~1s delay per post)...")
        for i, post in enumerate(posts):
            post["comments"] = fetch_comments(session, post["permalink"])
            print(f"  {i+1}/{len(posts)}: {len(post['comments'])} comments — {post['title'][:60]}")
            time.sleep(1.1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(posts)} posts to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
