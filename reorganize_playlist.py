#!/usr/bin/env python3
"""
Reorganize a Spotify playlist for better mixing flow.

Uses harmonic mixing (Camelot wheel) + BPM-aware ordering so tracks
transition smoothly without clashing keys or jarring tempo jumps.

Usage:
    pip install spotipy
    export SPOTIPY_CLIENT_ID=<your_client_id>
    export SPOTIPY_CLIENT_SECRET=<your_client_secret>
    export SPOTIPY_REDIRECT_URI=http://localhost:8888/callback
    python reorganize_playlist.py

Get credentials at: https://developer.spotify.com/dashboard
  - Create an app, add http://localhost:8888/callback as a Redirect URI.
"""

import os
import math
import spotipy
from spotipy.oauth2 import SpotifyOAuth

PLAYLIST_ID = "65UwEggcQemj9TDxtI5HQQ"

# Spotify key index (0=C, 1=C#, 2=D, ..., 11=B) + mode (0=minor, 1=major)
# maps to Camelot wheel position (number 1-12, letter A=minor B=major)
CAMELOT = {
    (0, 1): (8, "B"),  (1, 1): (3, "B"),  (2, 1): (10, "B"), (3, 1): (5, "B"),
    (4, 1): (12, "B"), (5, 1): (7, "B"),  (6, 1): (2, "B"),  (7, 1): (9, "B"),
    (8, 1): (4, "B"),  (9, 1): (11, "B"), (10, 1): (6, "B"), (11, 1): (1, "B"),
    (0, 0): (5, "A"),  (1, 0): (12, "A"), (2, 0): (7, "A"),  (3, 0): (2, "A"),
    (4, 0): (9, "A"),  (5, 0): (4, "A"),  (6, 0): (11, "A"), (7, 0): (6, "A"),
    (8, 0): (1, "A"),  (9, 0): (8, "A"),  (10, 0): (3, "A"), (11, 0): (10, "A"),
}


def camelot_distance(a, b):
    """Return a compatibility score between two Camelot positions (lower = better)."""
    if a is None or b is None:
        return 6
    num_a, let_a = a
    num_b, let_b = b

    # Same position: perfect match
    if num_a == num_b and let_a == let_b:
        return 0
    # Adjacent number same letter (e.g. 8B -> 9B or 7B): energy boost/drop
    diff = (num_b - num_a) % 12
    if diff in (1, 11) and let_a == let_b:
        return 1
    # Same number, switch letter (e.g. 8B -> 8A): relative major/minor switch
    if num_a == num_b and let_a != let_b:
        return 1
    # Two steps away, same letter
    if diff in (2, 10) and let_a == let_b:
        return 2
    # Otherwise increasingly incompatible
    min_diff = min(diff, 12 - diff)
    return min_diff + (0 if let_a == let_b else 1)


def bpm_distance(bpm_a, bpm_b):
    """Normalized BPM distance (accounts for half/double time)."""
    if bpm_a <= 0 or bpm_b <= 0:
        return 1.0
    ratio = max(bpm_a, bpm_b) / min(bpm_a, bpm_b)
    if ratio > 1.8:
        ratio = ratio / 2  # half/double time
    return abs(ratio - 1.0)


def track_score(current, candidate, weight_key=3.0, weight_bpm=1.5, weight_energy=0.5):
    """Lower score = better next track after `current`."""
    key_score = camelot_distance(current["camelot"], candidate["camelot"])
    bpm_score = bpm_distance(current["bpm"], candidate["bpm"]) * 10
    energy_score = abs(current["energy"] - candidate["energy"])
    return weight_key * key_score + weight_bpm * bpm_score + weight_energy * energy_score


def greedy_order(tracks):
    """Greedy nearest-neighbor ordering starting from the most 'median' track."""
    if not tracks:
        return []

    # Start from the track closest to the median BPM and energy
    bpms = [t["bpm"] for t in tracks if t["bpm"] > 0]
    median_bpm = sorted(bpms)[len(bpms) // 2] if bpms else 120

    def start_score(t):
        return abs(t["bpm"] - median_bpm) + t["energy"] * 10

    remaining = list(tracks)
    remaining.sort(key=start_score)
    ordered = [remaining.pop(0)]

    while remaining:
        current = ordered[-1]
        best = min(remaining, key=lambda c: track_score(current, c))
        ordered.append(best)
        remaining.remove(best)

    return ordered


def get_all_tracks(sp, playlist_id):
    """Fetch every track in the playlist (handles pagination)."""
    tracks = []
    results = sp.playlist_items(playlist_id, fields="items,next,total")
    while results:
        for item in results["items"]:
            track = item.get("track")
            if track and track.get("id"):
                tracks.append(track)
        results = sp.next(results) if results.get("next") else None
    return tracks


def enrich_with_features(sp, tracks):
    """Add audio features (BPM, key, energy) to each track dict."""
    ids = [t["id"] for t in tracks]
    features_map = {}
    # Fetch in batches of 100 (API limit)
    for i in range(0, len(ids), 100):
        batch = sp.audio_features(ids[i : i + 100]) or []
        for f in batch:
            if f:
                features_map[f["id"]] = f

    enriched = []
    for t in tracks:
        f = features_map.get(t["id"], {})
        key = f.get("key", -1)
        mode = f.get("mode", -1)
        camelot = CAMELOT.get((key, mode)) if key != -1 and mode != -1 else None
        camelot_str = f"{camelot[0]}{camelot[1]}" if camelot else "?"
        enriched.append({
            "id": t["id"],
            "uri": t["uri"],
            "name": t["name"],
            "artist": ", ".join(a["name"] for a in t["artists"]),
            "bpm": round(f.get("tempo", 0), 1),
            "key": key,
            "mode": mode,
            "camelot": camelot,
            "camelot_str": camelot_str,
            "energy": f.get("energy", 0.5),
            "danceability": f.get("danceability", 0.5),
        })
    return enriched


def reorder_playlist(sp, playlist_id, ordered_uris):
    """Replace playlist contents with tracks in the new order."""
    sp.playlist_replace_items(playlist_id, [])
    for i in range(0, len(ordered_uris), 100):
        sp.playlist_add_items(playlist_id, ordered_uris[i : i + 100])


def main():
    sp = spotipy.Spotify(
        auth_manager=SpotifyOAuth(
            scope="playlist-modify-public playlist-modify-private",
            open_browser=True,
        )
    )

    print(f"Fetching playlist {PLAYLIST_ID}...")
    playlist = sp.playlist(PLAYLIST_ID, fields="name,tracks.total")
    print(f'Playlist: "{playlist["name"]}" — {playlist["tracks"]["total"]} tracks\n')

    raw_tracks = get_all_tracks(sp, PLAYLIST_ID)
    print(f"Fetched {len(raw_tracks)} tracks. Getting audio features...")
    tracks = enrich_with_features(sp, raw_tracks)

    print("\nOriginal order:")
    for i, t in enumerate(tracks, 1):
        print(f"  {i:2}. [{t['camelot_str']:3}] {t['bpm']:5.1f} BPM  {t['artist']} — {t['name']}")

    ordered = greedy_order(tracks)

    print("\nReordered for mixing:")
    for i, t in enumerate(ordered, 1):
        print(f"  {i:2}. [{t['camelot_str']:3}] {t['bpm']:5.1f} BPM  {t['artist']} — {t['name']}")

    answer = input("\nApply this order to Spotify? [y/N] ").strip().lower()
    if answer == "y":
        print("Updating playlist...")
        reorder_playlist(sp, PLAYLIST_ID, [t["uri"] for t in ordered])
        print("Done! Playlist updated.")
    else:
        print("No changes made.")


if __name__ == "__main__":
    main()
