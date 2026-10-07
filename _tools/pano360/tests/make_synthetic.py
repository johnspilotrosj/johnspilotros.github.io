#!/usr/bin/env python3
"""Make a fake 'turn in place' phone video of a textured room, for testing pano360 without real footage.

  make_synthetic.py out.mp4 [--ffmpeg path/to/ffmpeg]
"""
import argparse, math, subprocess

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--ffmpeg", default="ffmpeg")
ap.add_argument("--seconds", type=float, default=14)
a = ap.parse_args()

rng = np.random.default_rng(7)
EW, EH = 4096, 2048
room = np.zeros((EH, EW, 3), np.uint8)
room[:] = (205, 214, 222)
room[EH * 2 // 3:] = (70, 100, 140)                       # floor
for _ in range(900):                                      # posters, furniture, clutter
    x, y = int(rng.integers(0, EW)), int(rng.integers(EH // 5, EH - 80))
    w, h = int(rng.integers(20, 160)), int(rng.integers(20, 160))
    c = tuple(int(v) for v in rng.integers(0, 255, 3))
    if rng.random() < 0.5:
        cv2.rectangle(room, (x, y), (x + w, y + h), c, -1)
    else:
        cv2.circle(room, (x, y), w // 3 + 4, c, -1)
    if rng.random() < 0.3:
        cv2.putText(room, str(int(rng.integers(0, 999))), (x, y), 0, 1.2, (20, 20, 20), 2)
room = cv2.GaussianBlur(room, (3, 3), 0)

W, H, FPS = 1080, 1920, 30
f = (W / 2) / math.tan(math.radians(63 / 2))
xs, ys = np.meshgrid(np.arange(W) - W / 2 + .5, np.arange(H) - H / 2 + .5)
rays = np.stack([xs, -ys, np.full_like(xs, f)], -1)
rays /= np.linalg.norm(rays, axis=-1, keepdims=True)

p = subprocess.Popen([a.ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                      "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", a.out],
                     stdin=subprocess.PIPE)
n = int(a.seconds * FPS)
for k in range(n):
    yaw = math.radians(380 * k / (n - 1))
    pitch = math.radians(-8 + 2 * math.sin(k / 15))
    cp, sp, cy, sy = math.cos(pitch), math.sin(pitch), math.cos(yaw), math.sin(yaw)
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    d = rays @ (Ry @ Rx).T
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1], -1, 1))
    mx = ((lon + np.pi) / (2 * np.pi) * EW - .5).astype(np.float32)
    my = ((np.pi / 2 - lat) / np.pi * EH - .5).astype(np.float32)
    p.stdin.write(cv2.remap(room, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP).tobytes())
p.stdin.close()
p.wait()
print(f"wrote {a.out}: {n} frames, 380° turn")
