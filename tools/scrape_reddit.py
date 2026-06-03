#!/usr/bin/env python3
"""Scrape Reddit posts and comments via the unofficial .json endpoints."""

import argparse
import json
import os
import time

import requests

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", ".tmp", "reddit_posts.json")


def fetch_json(url, params=None):
    resp = requests.get(url, headers=HEADERS, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def fetch_posts(subreddit=None, query=None, limit=25):
    if query and subreddit:
        url = f"https://www.reddit.com/r/{subreddit}/search.json"
        params = {"q": query, "restrict_sr": 1, "sort": "relevance", "limit": min(limit, 100), "t": "all"}
    elif query:
        url = "https://www.reddit.com/search.json"
        params = {"q": query, "sort": "relevance", "limit": min(limit, 100), "t": "all"}
    else:
        url = f"https://www.reddit.com/r/{subreddit}.json"
        params = {"limit": min(limit, 100)}

    data = fetch_json(url, params)
    children = data.get("data", {}).get("children", [])
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
            "comments": [],
        })
    return posts


def fetch_comments(permalink):
    url = permalink.rstrip("/") + ".json"
    try:
        data = fetch_json(url, params={"limit": 20, "depth": 2})
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
    parser = argparse.ArgumentParser(description="Scrape Reddit posts and comments.")
    parser.add_argument("--subreddit", help="Subreddit name without r/")
    parser.add_argument("--query", help="Search query")
    parser.add_argument("--limit", type=int, default=25, help="Max posts to fetch (default 25)")
    parser.add_argument("--comments", action="store_true", help="Fetch top comments per post")
    args = parser.parse_args()

    if not args.subreddit and not args.query:
        parser.error("Provide at least --subreddit or --query")

    print(f"Fetching up to {args.limit} posts...")
    posts = fetch_posts(subreddit=args.subreddit, query=args.query, limit=args.limit)
    print(f"  Got {len(posts)} posts")

    if args.comments:
        print(f"Fetching comments (1 req/post, ~1s delay)...")
        for i, post in enumerate(posts):
            post["comments"] = fetch_comments(post["permalink"])
            print(f"  {i+1}/{len(posts)}: {len(post['comments'])} comments — {post['title'][:60]}")
            time.sleep(1.1)

    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(posts)} posts to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
