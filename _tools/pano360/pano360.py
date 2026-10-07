#!/usr/bin/env python3
"""pano360: turn an iPhone "turn in place" room video into a 360° panorama and tour.

  pano360.py check  VIDEO_OR_DRIVE_LINK                 quick look: turn speed, blur, usable turn
  pano360.py stitch VIDEO_OR_DRIVE_LINK --name bedroom  full stitch -> out/bedroom/
  pano360.py tour   tour.html out/bedroom out/hallway --link "Bedroom>Hallway@-68,-8"

Needs: ffmpeg, hugin-tools (pto_gen, cpfind, cpclean, autooptimiser, pano_modify, nona,
checkpto), enblend (or verdandi), Python with opencv-python-headless, numpy, pillow.
"""
import argparse, base64, glob, html, json, math, os, re, shutil, subprocess, sys, tempfile, urllib.request, webbrowser

import cv2
import numpy as np
from PIL import Image

PANO_W, PANO_H = 8192, 4096          # working equirect size
OUT_W, OUT_H, JPEG_Q = 4096, 2048, 80
HFOV_GUESS = 68                      # short-side FOV of 0.5x video; optimiser refines it
WARN = []
APP_DIR = os.path.dirname(sys.executable if getattr(sys, "frozen", False) else os.path.abspath(__file__))


def use_bundled_tools():
    """The Windows package ships Hugin and ffmpeg in a 'tools' folder next to the EXE."""
    root = os.path.join(APP_DIR, "tools")
    if not os.path.isdir(root):
        return
    for dp, _, files in os.walk(root):
        names = {f.lower() for f in files}
        if names & {"ffmpeg.exe", "pto_gen.exe", "ffmpeg", "pto_gen"}:
            os.environ["PATH"] = dp + os.pathsep + os.environ.get("PATH", "")


if os.name == "nt":                                  # Windows console: show ° and ≈ instead of crashing
    try:
        import ctypes
        ctypes.windll.kernel32.SetConsoleOutputCP(65001)
    except Exception:
        pass
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def log(msg):
    print(msg, flush=True)


def warn(msg):
    WARN.append(msg)
    log("WARNING: " + msg)


def run(cmd, cwd=None, timeout=None, check=True):
    """Run a command, hide its chatter, return combined output."""
    try:
        p = subprocess.run(cmd, cwd=cwd, timeout=timeout, capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        if check:
            raise RuntimeError(f"timed out: {' '.join(cmd[:2])}")
        return None
    out = (p.stdout or "") + (p.stderr or "")
    if check and p.returncode != 0:
        tail = "\n".join(l for l in out.splitlines() if "EXIF" not in l)[-2000:]
        raise RuntimeError(f"{cmd[0]} failed:\n{tail}")
    return out


# ---------------------------------------------------------------- input / video

def fetch(src, work):
    """Local path, or a Google Drive share link (file must be 'Anyone with the link')."""
    if os.path.exists(src):
        return os.path.abspath(src)
    m = re.search(r"/d/([\w-]{20,})", src) or re.search(r"[?&]id=([\w-]{20,})", src)
    if not m:
        sys.exit(f"Not a file or Google Drive link: {src}")
    url = f"https://drive.usercontent.google.com/download?id={m.group(1)}&export=download&confirm=t"
    dst = os.path.join(work, "video.mov")
    log("Downloading from Google Drive...")
    with urllib.request.urlopen(url) as r, open(dst, "wb") as f:
        if "text/html" in r.headers.get("Content-Type", ""):
            sys.exit("Drive returned a web page, not the video. Share it as 'Anyone with the link'.")
        shutil.copyfileobj(r, f, 1 << 20)
    log(f"  {os.path.getsize(dst) / 1e6:.0f} MB")
    return dst


def probe(video):
    j = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,r_frame_rate,color_transfer:stream_side_data=rotation:format=duration",
                        "-of", "json", video]))
    s = j["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    rot = 0
    for sd in s.get("side_data_list", []):
        rot = int(sd.get("rotation", 0))
    w, h = s["width"], s["height"]
    if abs(rot) == 90:
        w, h = h, w
    return dict(w=w, h=h, fps=float(num) / float(den), dur=float(j["format"]["duration"]),
                hdr=s.get("color_transfer") in ("arib-std-b67", "smpte2084"),
                transfer=s.get("color_transfer"))


def tonemap_filter(info):
    if not info["hdr"]:
        return "format=rgb24"
    if "zscale" not in run(["ffmpeg", "-hide_banner", "-filters"], check=False):
        warn("ffmpeg has no zscale filter; HDR video is not tone-mapped and will look flat")
        return "format=rgb24"
    tin = info["transfer"]
    return (f"zscale=tin={tin}:min=bt2020nc:pin=bt2020:t=linear:npl=203,format=gbrpf32le,"
            "zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=pc,format=rgb24")


def extract_frames(video, numbers, vf, outdir, prefix="img"):
    """Extract exact frame numbers (counted from 0) as full-res JPEGs."""
    os.makedirs(outdir, exist_ok=True)
    sel = "+".join(f"eq(n\\,{n})" for n in numbers)
    run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"select='{sel}',{vf}", "-fps_mode", "passthrough",
         "-q:v", "1", "-qmin", "1", os.path.join(outdir, f"{prefix}_%02d.jpg"), "-y"])
    return sorted(glob.glob(os.path.join(outdir, f"{prefix}_*.jpg")))


def frame_sharpness(video, info, t0, t1, step=2):
    """Laplacian sharpness of every `step`-th frame in [t0, t1] (luma, half size, fast)."""
    w, h = info["w"] // 2 // 2 * 2, info["h"] // 2 // 2 * 2
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-t", f"{t1 + 0.05:.3f}", "-vf",
                          f"scale={w}:{h},format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         stdout=subprocess.PIPE)
    out, n = [], 0
    while True:
        b = p.stdout.read(w * h)
        if len(b) < w * h:
            break
        t = n / info["fps"]
        if t >= t0 and n % step == 0:
            g = np.frombuffer(b, np.uint8).reshape(h, w)
            out.append((n, t, float(cv2.Laplacian(g, cv2.CV_64F).var())))
        n += 1
    p.wait()
    return out


# ---------------------------------------------------------------- motion analysis

def analyse(video, info, vf, work):
    """10 fps, 540 px short side: frame-to-frame rotation, parallax residual, sharpness."""
    d = os.path.join(work, "ana")
    os.makedirs(d, exist_ok=True)
    short = "540:-2" if info["w"] < info["h"] else "-2:540"
    run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps=10,{vf},scale={short}", "-q:v", "3",
         os.path.join(d, "f_%04d.jpg"), "-y"])
    files = sorted(glob.glob(os.path.join(d, "f_*.jpg")))
    g0 = cv2.imread(files[0], 0)
    H, W = g0.shape
    f = (min(W, H) / 2) / math.tan(math.radians(HFOV_GUESS / 2))
    K = np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1.0]])
    Ki = np.linalg.inv(K)
    sift, bf = cv2.SIFT_create(1500), cv2.BFMatcher()

    def bearings(p):
        h = np.c_[p, np.ones(len(p))] @ Ki.T
        return h / np.linalg.norm(h, axis=1, keepdims=True)

    steps, prev = [], None
    for i, path in enumerate(files):
        g = cv2.imread(path, 0)
        kp, de = sift.detectAndCompute(g, None)
        rec = dict(t=i / 10, sharp=float(cv2.Laplacian(g, cv2.CV_64F).var()), ok=False)
        if prev is not None and de is not None and prev[1] is not None and len(kp) > 20 and len(prev[0]) > 20:
            m = [a for a, b in bf.knnMatch(prev[1], de, k=2) if a.distance < 0.75 * b.distance]
            if len(m) >= 15:
                p0 = np.float32([prev[0][a.queryIdx].pt for a in m])
                p1 = np.float32([kp[a.trainIdx].pt for a in m])
                _, inl = cv2.findHomography(p0, p1, cv2.RANSAC, 3.0)
                if inl is not None and inl.sum() >= 12:
                    inl = inl.ravel().astype(bool)
                    b0, b1 = bearings(p0[inl]), bearings(p1[inl])
                    U, _, Vt = np.linalg.svd(b1.T @ b0)
                    R = U @ np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))]) @ Vt
                    res = np.degrees(np.arccos(np.clip(np.sum((b0 @ R.T) * b1, 1), -1, 1)))
                    rec.update(ok=True, R=R.tolist(),
                               step=float(np.degrees(np.arccos(np.clip((np.trace(R) - 1) / 2, -1, 1)))),
                               resid=float(np.median(res)) * f * math.pi / 180)
        steps.append(rec)
        prev = (kp, de)
    contact_sheet(files, os.path.join(work, "contact.jpg"))
    return steps


def contact_sheet(files, out, every=5, cols=13):
    tiles = []
    for i in range(0, len(files), every):
        im = cv2.imread(files[i])
        im = cv2.resize(im, (150, int(150 * im.shape[0] / im.shape[1])))
        cv2.putText(im, f"{i / 10:.1f}s", (4, 18), 0, 0.55, (0, 255, 255), 2)
        tiles.append(im)
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(out, np.vstack([np.hstack(tiles[k:k + cols]) for k in range(0, len(tiles), cols)]))


def yaw_track(steps, i0, i1):
    """Cumulative yaw (deg) from frame i0 to i1; blur gaps reuse the last good step."""
    Rabs, last = np.eye(3), np.eye(3)
    yaws, prev_yaw, acc = [0.0], 0.0, 0.0
    for i in range(i0 + 1, i1 + 1):
        s = steps[i]
        R = np.array(s["R"]) if s["ok"] else last
        last = R
        Rabs = R @ Rabs
        fwd = Rabs.T @ np.array([0, 0, 1.0])
        y = math.degrees(math.atan2(fwd[0], fwd[2]))
        d = (y - prev_yaw + 180) % 360 - 180
        acc += d
        prev_yaw = y
        yaws.append(acc)
    return np.array(yaws)


def find_turns(steps, fps_a=10):
    """Runs of clean rotation (low parallax residual), bridging short blur gaps."""
    thr, segs, cur, gap = 1.5, [], None, 0
    for i in range(1, len(steps)):
        s = steps[i]
        if s["ok"] and s["resid"] < thr:
            cur = [i - 1, i] if cur is None else [cur[0], i]
            gap = 0
        elif cur is not None and not s["ok"] and gap < 3:
            gap += 1                                  # blurred frame: keep going
        else:
            if cur:
                segs.append(cur)
            cur, gap = None, 0
    if cur:
        segs.append(cur)
    out = []
    for a, b in segs:
        y = yaw_track(steps, a, b)
        sweep = abs(y[-1])
        speed = sweep / max((b - a) / fps_a, 0.1)
        if abs(y).max() >= 375:                       # trim to one lap plus overlap
            b = a + int(np.argmax(abs(y) >= 375))
            sweep = abs(yaw_track(steps, a, b)[-1])
        sharp = float(np.median([steps[i]["sharp"] for i in range(a, b + 1)]))
        out.append(dict(t0=a / fps_a, t1=b / fps_a, i0=a, i1=b, sweep=sweep, speed=speed, sharp=sharp))
    return out


def describe(steps, turns):
    ok = [s for s in steps if s["ok"]]
    speed = np.median([s["step"] for s in ok]) * 10 if ok else 0
    log(f"Turn speed (median): {speed:.0f}°/s   frames that could not be matched: "
        f"{100 * (1 - len(ok) / max(len(steps) - 1, 1)):.0f}%")
    if speed > 50:
        warn(f"you turned at about {speed:.0f}°/s; aim for 12–15°/s (25–30 s per lap) to avoid blur")
    log("Clean turn-in-place stretches:")
    for t in [t for t in turns if t["sweep"] >= 30]:
        mark = "full lap" if t["sweep"] >= 330 else "partial"
        log(f"  {t['t0']:5.1f}–{t['t1']:5.1f} s  {t['sweep']:4.0f}° ({mark}), {t['speed']:.0f}°/s")
    if not turns:
        log("  none found")


def pick_turn(turns):
    full = [t for t in turns if t["sweep"] >= 330]
    if full:
        return max(full, key=lambda t: (min(t["sweep"], 375), t["sharp"]))
    if turns:
        best = max(turns, key=lambda t: t["sweep"])
        warn(f"no full 360° turn without walking; using {best['t0']:.1f}–{best['t1']:.1f} s "
             f"({best['sweep']:.0f}°). Expect a missing wedge.")
        return best
    sys.exit("No usable turn found. Check contact.jpg and pass --turn START-END.")


# ---------------------------------------------------------------- frame choice

def select_frames(video, info, steps, t0, t1):
    """Sharpest frames 12–21° apart around the lap (dynamic programming)."""
    i0, i1 = int(round(t0 * 10)), min(int(round(t1 * 10)), len(steps) - 1)
    yaw = np.abs(yaw_track(steps, i0, i1))
    ta = np.arange(i0, i1 + 1) / 10
    cand = frame_sharpness(video, info, t0, t1)
    n = np.array([c[0] for c in cand])
    ts = np.array([c[1] for c in cand])
    sh = np.array([c[2] for c in cand])
    keep = ts <= t1
    n, ts, sh = n[keep], ts[keep], sh[keep]
    y = np.interp(ts, ta, yaw)
    rel = np.array([sh[i] / np.median(sh[max(0, i - 8):i + 9]) for i in range(len(sh))])
    full = y[-1] - y[0] >= 345
    best = None
    for start in [i for i in range(len(y)) if y[i] <= y[0] + 12]:
        score = {start: (math.log(rel[start]), [start])}
        for i in range(start + 1, len(y)):
            c = [(score[j][0] + math.log(rel[i]), score[j][1] + [i]) for j in score if 12 <= y[i] - y[j] <= 21]
            if c:
                score[i] = max(c, key=lambda q: q[0])
        for i, (sc, path) in score.items():
            closes = 12 <= y[start] + 360 - y[i] <= 21
            if (closes or not full) and (best is None or sc > best[0]):
                if not full and y[path[-1]] < y[-1] - 21:
                    continue
                best = (sc, path)
    if best is None:                                  # fallback: sharpest per 15° bin
        warn("frame spacing fell back to simple bins")
        path = [int(np.argmax(np.where((y >= b) & (y < b + 15), sh, -1)))
                for b in np.arange(y[0], y[-1], 15) if ((y >= b) & (y < b + 15)).any()]
    else:
        path = best[1]
    return [int(n[i]) for i in path], float(np.median(sh))


# ---------------------------------------------------------------- Hugin project handling

class Pto:
    """Minimal .pto reader/writer: image lines as token lists, control points kept verbatim."""
    LENS = ("v", "a", "b", "c", "d", "e", "g", "t", "Ra", "Rb", "Rc", "Rd", "Re", "Va", "Vb", "Vc", "Vd", "Vx", "Vy")

    def __init__(self, path):
        self.head, self.imgs, self.cps = [], [], []
        for l in open(path).read().split("\n"):
            if l.startswith("i "):
                toks = []
                for tok in l[2:].split():
                    m = re.match(r"([A-Za-z]+)(=?)(.*)", tok)
                    toks.append([m.group(1), m.group(2) == "=", m.group(3)])
                self.imgs.append(toks)
            elif l.startswith("c "):
                self.cps.append(l)
            elif l.startswith(("p ", "m ")):
                self.head.append(l)

    def get(self, i, k):
        for t in self.imgs[i]:
            if t[0] == k:
                if t[1]:
                    return self.get(int(t[2]), k)
                return t[2]
        return None

    def set(self, i, k, v):
        for t in self.imgs[i]:
            if t[0] == k:
                t[1], t[2] = False, str(v)
                return
        self.imgs[i].insert(-1, [k, False, str(v)])

    def subset(self, keep):
        keep = sorted(keep)
        linked = {t[0] for img in self.imgs[1:] for t in img if t[1]}
        first = [list(t) for t in self.imgs[keep[0]]]
        for t in first:
            if t[1]:
                t[1], t[2] = False, self.get(int(t[2]), t[0])
        new = [first]
        for j in keep[1:]:
            img = [list(t) for t in self.imgs[j]]
            for t in img:
                if t[0] in linked:
                    t[1], t[2] = True, "0"
            new.append(img)
        mp = {o: k for k, o in enumerate(keep)}
        cps = []
        for c in self.cps:
            a, b = int(re.search(r" n(\d+)", c).group(1)), int(re.search(r" N(\d+)", c).group(1))
            if a in mp and b in mp:
                c = re.sub(r" n\d+", f" n{mp[a]}", c, count=1)
                cps.append(re.sub(r" N\d+", f" N{mp[b]}", c, count=1))
        self.imgs, self.cps = new, cps

    def write(self, path, opt):
        lines = list(self.head)
        for img in self.imgs:
            lines.append("i " + " ".join(k + ("=" if l else "") + v for k, l, v in img))
        lines += self.cps
        lines += [f"v {v}" for v in opt] + ["v", ""]
        open(path, "w").write("\n".join(lines))


def optimise(src, dst, cwd, timeout, photometric=False):
    out = run(["autooptimiser", "-m" if photometric else "-n", "-o", dst, src], cwd=cwd, timeout=timeout,
              check=False)
    if out is None or not os.path.exists(os.path.join(cwd, dst)):
        return None
    r = re.findall(r"after \d+ iteration\(s\):\s+([\d.]+) units", out)
    return float(r[-1]) if r else 0.0


def groups(pto, cwd):
    out = run(["checkpto", pto], cwd=cwd, check=False) or ""
    if "All images are connected" in out:
        return None
    return [[int(x) for x in g.split(",") if x.strip()] for g in re.findall(r"\[([\d,\s]+)\]", out)]


def pose_vars(n, extra=()):
    v = [f"{k}{i}" for i in range(1, n) for k in "ypr"]
    return v + list(extra)


def render(pto_in, cwd, tag):
    """Equirect remap + blend. Returns path of the blended (cropped) TIFF."""
    run(["pano_modify", "--projection=2", "--fov=360x180", f"--canvas={PANO_W}x{PANO_H}",
         "--straighten", "--center", "-o", f"{tag}_r.pto", pto_in], cwd=cwd)
    for f in glob.glob(os.path.join(cwd, f"{tag}_rem*.tif")):
        os.remove(f)
    run(["nona", "-m", "TIFF_m", "-o", f"{tag}_rem", f"{tag}_r.pto"], cwd=cwd, timeout=1800)
    rem = sorted(os.path.basename(f) for f in glob.glob(os.path.join(cwd, f"{tag}_rem*.tif")))
    out = f"{tag}_blend.tif"
    run(["enblend", "--wrap=horizontal", "-o", out] + rem, cwd=cwd, timeout=1800, check=False)
    if not os.path.exists(os.path.join(cwd, out)):
        log("  enblend failed, using verdandi")
        run(["verdandi", "--wrap", "-o", out] + rem, cwd=cwd, timeout=1800)
    return os.path.join(cwd, out)


def hugin_stitch(frames, cwd, scale_ref):
    names = [os.path.basename(f) for f in frames]
    run(["pto_gen", "-o", "p0.pto", "-p", "0", "-f", str(HFOV_GUESS)] + names, cwd=cwd)
    log("  finding control points...")
    run(["cpfind", "--multirow", "--sieve2size=4", "-o", "p1.pto", "p0.pto"], cwd=cwd, timeout=3600)
    run(["cpclean", "-o", "p2.pto", "p1.pto"], cwd=cwd)
    P = Pto(os.path.join(cwd, "p2.pto"))
    g = groups("p2.pto", cwd)
    if g:
        big = max(g, key=len)
        warn(f"{len(frames) - len(big)} of {len(frames)} frames could not be linked and were dropped "
             "(blank walls or blur); expect gaps")
        P.subset(big)
    n = len(P.imgs)
    log(f"  aligning {n} frames...")
    P.write(os.path.join(cwd, "p3.pto"), [])
    # auto-align first: frames all start facing the same way, plain optimisation gets lost
    out = run(["autooptimiser", "-a", "-l", "-s", "-o", "a1.pto", "p3.pto"], cwd=cwd, timeout=900, check=False)
    if out is None or not os.path.exists(os.path.join(cwd, "a1.pto")):
        raise RuntimeError("alignment did not finish")
    P = Pto(os.path.join(cwd, "a1.pto"))
    P.write(os.path.join(cwd, "a2.pto"), pose_vars(n, ["v0", "a0", "b0", "c0", "d0", "e0"]))
    rms = optimise("a2.pto", "a3.pto", cwd, 900)
    if rms is None:
        raise RuntimeError("alignment did not finish")
    run(["cpclean", "-o", "a4.pto", "a3.pto"], cwd=cwd)
    rms = optimise("a4.pto", "a5.pto", cwd, 900) or rms
    best = "a5.pto"
    P = Pto(os.path.join(cwd, best))
    for i in range(1, len(P.imgs)):                  # stabiliser shift + rolling shutter, per frame
        for k in ("d", "e", "g", "t"):
            P.set(i, k, 0)
    per = [f"{k}{i}" for i in range(len(P.imgs)) for k in "degt"]
    P.write(os.path.join(cwd, "b.pto"), pose_vars(len(P.imgs), ["v0", "a0", "b0", "c0"] + per))
    rms_b = optimise("b.pto", "b1.pto", cwd, 900)
    if rms_b is not None and rms_b < rms:
        Q = Pto(os.path.join(cwd, "b1.pto"))
        # pixel units; a failed solve runs off to thousands
        sane = all(abs(float(Q.get(i, k))) < 400 for i in range(len(Q.imgs)) for k in "de") and \
            all(abs(float(Q.get(i, k))) < 2000 for i in range(len(Q.imgs)) for k in "gt")
        if sane:
            rms, best = rms_b, "b1.pto"
        else:
            log("  per-frame correction looked implausible; kept the simpler model")
    if optimise(best, "ph.pto", cwd, 900, photometric=True) is not None:
        best = "ph.pto"
    P = Pto(os.path.join(cwd, best))
    hfov = float(P.get(0, "v"))
    out_px = rms * (OUT_W / 360) / (scale_ref / hfov)
    log(f"  alignment error {rms:.2f} px in source frames ≈ {out_px:.1f} px in the 4096 output")
    if out_px > 3:
        warn(f"alignment error is high ({out_px:.1f} px); expect visible seams on near objects")
    log("  rendering and blending...")
    return render(best, cwd, "main"), dict(frames=n, rms_src=rms, rms_out=out_px, hfov=hfov), P


# ---------------------------------------------------------------- canvas / faces / fill

def load_canvas(tif):
    t = Image.open(tif)
    xo = int(round(t.tag_v2.get(286, 0) * t.tag_v2.get(282, 150)))
    yo = int(round(t.tag_v2.get(287, 0) * t.tag_v2.get(283, 150)))
    im = cv2.imread(tif, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    can = np.zeros((PANO_H, PANO_W, 4), np.uint8)
    h, w = min(im.shape[0], PANO_H - yo), min(im.shape[1], PANO_W - xo)
    can[yo:yo + h, xo:xo + w] = im[:h, :w]
    return can


LAT = np.pi / 2 - (np.arange(PANO_H) + .5) / PANO_H * np.pi
LON = (np.arange(PANO_W) + .5) / PANO_W * 2 * np.pi - np.pi
COSW = np.cos(LAT)[:, None]


def coverage(alpha):
    return float(100 * ((alpha > 0) * COSW).sum() / (COSW.sum() * PANO_W))


def face_maps(F, tf, sign):
    u = np.linspace(-tf, tf, F)
    U, V = np.meshgrid(u, u)
    dx, dy, dz = U, np.full_like(U, float(sign)), V * sign
    n = np.sqrt(dx ** 2 + dy ** 2 + dz ** 2)
    lat, lon = np.arcsin(dy / n), np.arctan2(dx, dz)
    return (((lon + np.pi) / (2 * np.pi) * PANO_W - .5).astype(np.float32),
            ((np.pi / 2 - lat) / np.pi * PANO_H - .5).astype(np.float32))


def face_to_equi(rows, F, tf, sign):
    L, A = np.meshgrid(LON, LAT[rows])
    ex, ey, ez = np.cos(A) * np.sin(L), np.sin(A), np.cos(A) * np.cos(L)
    return ((((ex / (ey * sign)) / tf + 1) / 2 * (F - 1)).astype(np.float32),
            (((ez / ey) / tf + 1) / 2 * (F - 1)).astype(np.float32))


def pushpull(I, M):
    if min(I.shape[:2]) < 8:
        m = (I * M[..., None]).sum((0, 1)) / max(M.sum(), 1e-6)
        return np.where(M[..., None] > 0, I, m)
    Md = cv2.pyrDown(M)
    Id = cv2.pyrDown(I * M[..., None]) / np.maximum(Md, 1e-6)[..., None]
    up = cv2.pyrUp(pushpull(Id, (Md > 1e-3).astype(np.float32)), dstsize=(I.shape[1], I.shape[0]))
    return I * M[..., None] + up * (1 - M[..., None])


def finish(can):
    """Fill ceiling/floor caps and any horizon gap smoothly; return (filled, real_only) uint8 BGR."""
    img = can[..., :3].astype(np.float32)
    alpha = cv2.erode((can[..., 3] > 250).astype(np.uint8), np.ones((21, 21), np.uint8))
    out = img.copy()
    F, tf = 2048, math.tan(math.radians(70))
    for sign in (1, -1):
        mx, my = face_maps(F, tf, sign)
        face = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        fm = cv2.remap(alpha.astype(np.float32), mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_WRAP)
        fmk = cv2.erode((fm > .5).astype(np.uint8), np.ones((3, 3), np.uint8), iterations=6).astype(np.float32)
        filled = pushpull(face, fmk)
        filled = np.where(fmk[..., None] < .5, cv2.GaussianBlur(filled, (0, 0), 6), filled)
        rows = np.where(sign * LAT > math.radians(15))[0]
        px, py = face_to_equi(rows, F, tf, sign)
        cap = cv2.remap(filled, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        out[rows] = np.where(alpha[rows, :, None] > 0, img[rows], cap)
    hole = (alpha == 0) & (np.abs(LAT)[:, None] <= math.radians(16))
    if hole.any():
        sm = cv2.resize(out, (2048, 1024), interpolation=cv2.INTER_AREA)
        hm = cv2.dilate(cv2.resize(hole.astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_NEAREST),
                        np.ones((9, 9), np.uint8))
        f2 = cv2.GaussianBlur(pushpull(sm, (hm == 0).astype(np.float32)), (0, 0), 4)
        up = cv2.resize(f2, (PANO_W, PANO_H), interpolation=cv2.INTER_LINEAR)
        hw = cv2.GaussianBlur(cv2.dilate(hole.astype(np.uint8), np.ones((41, 41), np.uint8)).astype(np.float32),
                              (0, 0), 10)[..., None]
        out = out * (1 - hw) + up * hw
    a = cv2.GaussianBlur(cv2.erode(alpha, np.ones((45, 45), np.uint8)).astype(np.float32), (0, 0), 8)[..., None]
    final = img * a + out * (1 - a)
    final += np.random.default_rng(1).normal(0, 1.2, final.shape).astype(np.float32) * (1 - a)
    final = np.clip(final, 0, 255).astype(np.uint8)
    real = (img * alpha[..., None]).astype(np.uint8)
    rs = lambda x: cv2.resize(x, (OUT_W, OUT_H), interpolation=cv2.INTER_AREA)
    gap = float(hole[PANO_H // 2].mean() * 360)
    return rs(final), rs(real), gap


# ---------------------------------------------------------------- floor patch

def floor_patch(can, video, info, vf, t0, t1, lens, work):
    """Fill the floor from a tilt-down pass shot from (maybe) another spot: the floor is a plane,
    so a straight-down view from each spot maps onto the other with one homography."""
    d = os.path.join(work, "floor")
    os.makedirs(d, exist_ok=True)
    cand = frame_sharpness(video, info, t0, t1, step=1)
    cand = [c for c in cand if c[1] <= t1]
    if len(cand) < 5:
        warn("floor range too short; skipped")
        return can, None
    picks = [max(w, key=lambda c: c[2])[0] for w in np.array_split(cand, 5)]
    frames = extract_frames(video, [int(p) for p in picks], vf, d, "fl")
    names = [os.path.basename(f) for f in frames]
    run(["pto_gen", "-o", "f0.pto", "-p", "0", "-f", str(lens["v"])] + names, cwd=d)
    P = Pto(os.path.join(d, "f0.pto"))
    for k in ("v", "a", "b", "c"):
        P.set(0, k, lens[k])
    w, h = info["w"], info["h"]
    for i, pt in enumerate(np.linspace(-35, -68, len(names))):
        P.set(i, "p", round(float(pt), 1))
        P.set(i, "S", f"0,{w},0,{int(h * 0.86)}")    # crop the bottom: your feet
    P.write(os.path.join(d, "f1.pto"), pose_vars(len(names)))
    run(["cpfind", "--prealigned", "-o", "f2.pto", "f1.pto"], cwd=d, timeout=1800)
    run(["cpclean", "-o", "f3.pto", "f2.pto"], cwd=d)
    if groups("f3.pto", d):
        warn("floor frames did not link together; floor patch skipped")
        return can, None
    P = Pto(os.path.join(d, "f3.pto"))
    P.write(os.path.join(d, "f4.pto"), pose_vars(len(P.imgs)))
    if optimise("f4.pto", "f5.pto", d, 600) is None:
        warn("floor alignment timed out; floor patch skipped")
        return can, None
    run(["pano_modify", "--projection=2", "--fov=360x180", f"--canvas={PANO_W}x{PANO_H}", "-o", "f6.pto",
         "f5.pto"], cwd=d)
    run(["nona", "-m", "TIFF_m", "-o", "frem", "f6.pto"], cwd=d, timeout=1800)
    rem = sorted(os.path.basename(f) for f in glob.glob(os.path.join(d, "frem*.tif")))
    run(["enblend", "--wrap=horizontal", "-o", "B.tif"] + rem, cwd=d, timeout=1800, check=False)
    if not os.path.exists(os.path.join(d, "B.tif")):
        run(["verdandi", "--wrap", "-o", "B.tif"] + rem, cwd=d, timeout=1800)
    B = load_canvas(os.path.join(d, "B.tif"))

    F, tf = 2048, math.tan(math.radians(72))
    mx, my = face_maps(F, tf, -1)

    def face(c, er):
        a = cv2.erode((c[..., 3] > 250).astype(np.uint8), np.ones((er, er), np.uint8))
        return (cv2.remap(c[..., :3], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP),
                cv2.remap(a, mx, my, cv2.INTER_NEAREST, borderMode=cv2.BORDER_WRAP))

    fA, mA = face(can, 15)
    fB, mB = face(B, 9)
    sift, bf = cv2.SIFT_create(10000), cv2.BFMatcher()
    ka, da = sift.detectAndCompute(cv2.cvtColor(fA, cv2.COLOR_BGR2GRAY), mA * 255)
    kb, db = sift.detectAndCompute(cv2.cvtColor(fB, cv2.COLOR_BGR2GRAY), mB * 255)
    if da is None or db is None:
        warn("no floor texture to match; floor patch skipped")
        return can, None
    m = [x for x, y in bf.knnMatch(db, da, k=2) if x.distance < 0.8 * y.distance]
    if len(m) < 20:
        warn("floor views did not match; floor patch skipped")
        return can, None
    Pp = np.float32([kb[x.queryIdx].pt for x in m])
    Qq = np.float32([ka[x.trainIdx].pt for x in m])
    Hm, inl = cv2.findHomography(Pp, Qq, cv2.RANSAC, 5.0, maxIters=20000)
    inl = inl.ravel() > 0 if inl is not None else np.zeros(len(m), bool)
    err = np.median(np.linalg.norm(cv2.perspectiveTransform(Pp[inl][None], Hm)[0] - Qq[inl], axis=1)) \
        if inl.sum() else 99
    if inl.sum() < 20 or err > 2.5:
        warn(f"floor match too weak ({int(inl.sum())} points, {err:.1f} px); floor patch skipped")
        return can, None
    wB = cv2.warpPerspective(fB, Hm, (F, F)).astype(np.float32)
    wm = cv2.erode(cv2.warpPerspective(mB, Hm, (F, F), flags=cv2.INTER_NEAREST), np.ones((5, 5), np.uint8))
    ov = (wm > 0) & (mA > 0)
    if ov.sum() > 1000:
        wB *= np.median(fA[ov].astype(np.float32), 0) / np.maximum(np.median(wB[ov], 0), 1)
    wa = cv2.GaussianBlur(cv2.erode(mA, np.ones((71, 71), np.uint8)).astype(np.float32), (0, 0), 18)
    wa = np.where(wm > 0, wa, mA.astype(np.float32))
    blend = fA.astype(np.float32) * wa[..., None] + wB * (1 - wa[..., None])
    rows = np.where(LAT < math.radians(-30))[0]
    px, py = face_to_equi(rows, F, tf, -1)
    fc = cv2.remap(blend, px, py, cv2.INTER_LINEAR)
    fm = cv2.remap(((mA > 0) | (wm > 0)).astype(np.uint8), px, py, cv2.INTER_NEAREST)
    wq = cv2.remap(np.where(wm > 0, wa, 1.0).astype(np.float32), px, py, cv2.INTER_LINEAR)
    aE = cv2.erode((can[..., 3] > 250).astype(np.uint8), np.ones((15, 15), np.uint8))
    out = can.copy()
    sub = out[rows]
    put = (fm > 0) & ((aE[rows] == 0) | (wq < 0.995))
    sub[..., :3][put] = np.clip(fc[put], 0, 255).astype(np.uint8)
    sub[..., 3][put] = 255
    out[rows] = sub
    log(f"  floor patch matched with {int(inl.sum())} points, {err:.1f} px median error")
    return out, dict(points=int(inl.sum()), err=float(err))


# ---------------------------------------------------------------- tour page

TOUR_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>__TITLE__</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.css">
<style>
:root{--bg:#f3f4f2;--fg:#1d2321;--muted:#5d6763;--line:#d6dad6;--accent:#2f6f5e;--warn:#9a5b12}
@media (prefers-color-scheme:dark){:root{--bg:#131716;--fg:#e6ebe8;--muted:#9aa5a0;--line:#2b3331;--accent:#7cc4ae;--warn:#e0a458;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px 40px;display:grid;gap:14px}
h1{margin:0;font-size:clamp(1.4rem,3.5vw,2rem)}
#pano{width:100%;aspect-ratio:16/9;max-height:75vh;min-height:300px;background:#0b0e0d;border-radius:6px;overflow:hidden}
.views{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.views button{font:500 .9rem inherit;font-family:inherit;padding:8px 14px;border:1px solid var(--line);background:transparent;color:var(--fg);border-radius:4px;cursor:pointer}
.views button[aria-pressed=true]{border-color:var(--accent);color:var(--accent)}
#coords{margin-left:auto;color:var(--muted);font:13px ui-monospace,monospace}
.notes{border-top:1px solid var(--line);padding-top:12px;color:var(--muted)}
.notes li.w{color:var(--warn)}
.go{padding:6px 12px;border-radius:999px;background:rgba(16,20,19,.8);color:#fff;font:600 13px system-ui,sans-serif;border:2px solid #fff;cursor:pointer;white-space:nowrap}
</style></head><body><div class="wrap">
<h1>__TITLE__</h1>
<div id="pano"></div>
<div class="views" id="views"><span id="coords">Click the view to read yaw/pitch for links</span></div>
<ul class="notes" id="notes"></ul>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pannellum/2.5.6/pannellum.js"></script>
<script>
const SCENES=__SCENES__;
function hs(div,label){div.classList.add("go");div.textContent="↗ "+label;}
const cfg={default:{firstScene:SCENES[0].id,sceneFadeDuration:600,autoLoad:true},scenes:{}};
for(const s of SCENES){cfg.scenes[s.id]={type:"equirectangular",panorama:s.img,hfov:100,
  hotSpots:s.links.map(l=>({yaw:l.yaw,pitch:l.pitch,type:"scene",sceneId:l.to,cssClass:"pnlm-hotspot-base",
  createTooltipFunc:hs,createTooltipArgs:SCENES.find(x=>x.id===l.to).name}))};}
const viewer=pannellum.viewer("pano",cfg);
const views=document.getElementById("views"),notes=document.getElementById("notes");
for(const s of SCENES){const b=document.createElement("button");b.textContent=s.name;b.id="b-"+s.id;
  b.onclick=()=>{if(viewer.getScene()!==s.id)viewer.loadScene(s.id)};views.insertBefore(b,views.lastElementChild);}
function show(id){const s=SCENES.find(x=>x.id===id);
  for(const x of SCENES)document.getElementById("b-"+x.id).setAttribute("aria-pressed",x.id===id);
  notes.innerHTML="";for(const n of s.notes){const li=document.createElement("li");li.textContent=n.text;if(n.warn)li.className="w";notes.appendChild(li);}}
viewer.on("scenechange",show);show(SCENES[0].id);
viewer.on("mouseup",e=>{const c=viewer.mouseEventToCoords(e);
  document.getElementById("coords").textContent=`${viewer.getScene()}: yaw ${c[1].toFixed(0)}, pitch ${c[0].toFixed(0)}`;});
</script></body></html>
"""


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "scene"


def build_tour(out_html, scene_dirs, links, title):
    scenes = []
    for d in scene_dirs:
        jpg = d if d.endswith(".jpg") else os.path.join(d, "pano.jpg")
        rep_path = os.path.join(os.path.dirname(jpg), "report.json")
        rep = json.load(open(rep_path)) if os.path.exists(rep_path) else {}
        name = rep.get("name") or os.path.basename(os.path.dirname(jpg)) or "Scene"
        notes = []
        if rep:
            notes.append(dict(text=f"{name}: {rep['coverage_real']:.0f}% real photo, "
                                   f"alignment ≈{rep['hugin']['rms_out']:.1f} px, "
                                   f"turn {rep['turn'][0]:.1f}–{rep['turn'][1]:.1f} s"))
            notes += [dict(text=w, warn=True) for w in rep.get("warnings", [])]
        b64 = base64.b64encode(open(jpg, "rb").read()).decode()
        scenes.append(dict(id=slug(name), name=name.title() if name.islower() else name,
                           img="data:image/jpeg;base64," + b64, links=[], notes=notes))
    ids = {s["name"].lower(): s for s in scenes}
    ids.update({s["id"]: s for s in scenes})
    for spec in links or []:
        m = re.match(r"\s*(.+?)\s*>\s*(.+?)\s*@\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$", spec)
        if not m or m.group(1).lower() not in ids or m.group(2).lower() not in ids:
            warn(f"ignored link '{spec}' (format: From>To@yaw,pitch with scene names)")
            continue
        ids[m.group(1).lower()]["links"].append(dict(to=ids[m.group(2).lower()]["id"],
                                                     yaw=float(m.group(3)), pitch=float(m.group(4))))
    page = TOUR_HTML.replace("__TITLE__", html.escape(title)).replace("__SCENES__", json.dumps(scenes))
    open(out_html, "w").write(page)
    log(f"Tour written: {out_html} ({os.path.getsize(out_html) / 1e6:.1f} MB, {len(scenes)} scenes)")


# ---------------------------------------------------------------- commands

def parse_range(s):
    m = re.match(r"^\s*([\d.]+)\s*-\s*([\d.]+)\s*$", s or "")
    if not m:
        sys.exit(f"Bad time range '{s}', use START-END in seconds, e.g. 0-11.3")
    return float(m.group(1)), float(m.group(2))


def cmd_check(a):
    work = tempfile.mkdtemp(prefix="pano360_") if not a.work else a.work
    video = fetch(a.video, work)
    info = probe(video)
    log(f"{info['w']}x{info['h']} {info['fps']:.0f} fps, {info['dur']:.1f} s, HDR={info['hdr']}")
    steps = analyse(video, info, tonemap_filter(info), work)
    turns = find_turns(steps)
    describe(steps, turns)
    if turns:
        t = pick_turn(turns)
        log(f"Would stitch {t['t0']:.1f}–{t['t1']:.1f} s. Contact sheet: {os.path.join(work, 'contact.jpg')}")
    return 0


def cmd_stitch(a):
    WARN.clear()
    out = os.path.join(a.out, slug(a.name))
    os.makedirs(out, exist_ok=True)
    work = a.work or os.path.join(out, "work")
    os.makedirs(work, exist_ok=True)
    video = fetch(a.video, work)
    info = probe(video)
    log(f"{info['w']}x{info['h']} {info['fps']:.0f} fps, {info['dur']:.1f} s, HDR={info['hdr']}")
    if min(info["w"], info["h"]) < 2000:
        warn("video is below 4K; detail will be soft")
    vf = tonemap_filter(info)
    log("Analysing motion...")
    steps = analyse(video, info, vf, work)
    shutil.copy(os.path.join(work, "contact.jpg"), os.path.join(out, "contact.jpg"))
    turns = find_turns(steps)
    describe(steps, turns)
    if a.turn:
        t0, t1 = parse_range(a.turn)
    else:
        t = pick_turn(turns)
        t0, t1 = t["t0"], t["t1"]
    log(f"Using {t0:.1f}–{t1:.1f} s")
    nums, med_sharp = select_frames(video, info, steps, t0, t1)
    log(f"Picked {len(nums)} frames")
    frames = extract_frames(video, nums, vf, os.path.join(work, "frames"))
    tif, hug, P = hugin_stitch(frames, os.path.join(work, "frames"), info["w"])
    can = load_canvas(tif)
    cov0 = coverage(can[..., 3] > 250)
    floor = None
    if a.floor:
        f0, f1 = parse_range(a.floor)
        log(f"Adding floor from {f0:.1f}–{f1:.1f} s...")
        lens = {k: float(P.get(0, k)) for k in ("v", "a", "b", "c")}
        can, floor = floor_patch(can, video, info, vf, f0, f1, lens, work)
    cov = coverage(can[..., 3] > 250)
    log("Filling ceiling/floor gaps...")
    final, real, gap = finish(can)
    cv2.imwrite(os.path.join(out, "pano.jpg"), final, [cv2.IMWRITE_JPEG_QUALITY, JPEG_Q])
    cv2.imwrite(os.path.join(out, "pano_real_only.jpg"), real, [cv2.IMWRITE_JPEG_QUALITY, JPEG_Q])
    if gap > 1:
        warn(f"about {gap:.0f}° of the horizon was never captured sharply; it is a blur fill")
    a_ = (can[..., 3] > 250)
    top = [LAT[np.where(a_[:, x])[0].min()] for x in range(0, PANO_W, 64) if a_[:, x].any()]
    bot = [LAT[np.where(a_[:, x])[0].max()] for x in range(0, PANO_W, 64) if a_[:, x].any()]
    up, down = math.degrees(np.median(top)), math.degrees(np.median(bot))
    if up < 80:
        warn(f"ceiling above about {up:.0f}° is filled in, not real; film a lap tilted up from the same spot")
    if down > -80:
        warn(f"floor below about {down:.0f}° is filled in, not real; film a lap tilted down, or pass --floor")
    rep = dict(name=a.name, source=a.video, video=info, turn=[t0, t1], frames=len(nums),
               median_sharpness=med_sharp, hugin=hug, coverage_real_before_floor=cov0, coverage_real=cov,
               real_up_to_deg=up, real_down_to_deg=down, horizon_gap_deg=gap, floor=floor, warnings=WARN)
    json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=2)
    build_tour(os.path.join(out, "viewer.html"), [out], [], a.name)
    log(f"\nDone: {out}/pano.jpg  ({cov:.0f}% real photo, alignment ≈{hug['rms_out']:.1f} px)")
    for w in WARN:
        log(" - " + w)
    if not a.keep_work and not a.work:
        shutil.rmtree(work, ignore_errors=True)
    return 0


def cmd_tour(a):
    build_tour(a.output, a.scenes, a.link, a.title)
    return 0


def ask(prompt):
    try:
        return input(prompt).strip().strip('"').strip("'")
    except EOFError:
        return ""


def interactive(dropped):
    """Double-click (or drag videos onto the EXE): ask a few questions, stitch, open the tour."""
    print("pano360: iPhone room video to 360° tour\n")
    out_root = os.path.join(APP_DIR, "tours")
    rooms, queue = [], list(dropped)
    while True:
        n = len(rooms) + 1
        src = queue.pop(0) if queue else ask(
            f"Room {n} video: paste a Google Drive link or drag the file here (Enter when done): ")
        if not src:
            break
        if dropped and src in dropped:
            print(f"Room {n} video: {src}")
        name = ask(f"Room {n} name (e.g. Bedroom): ") or f"Room {n}"
        floor = ask("Seconds where you tilted down at the floor, e.g. 12.9-14.4 (Enter to skip): ")
        rooms.append((src, name, floor))
    if not rooms:
        return 0
    done = []
    for src, name, floor in rooms:
        print(f"\n=== {name} ===")
        try:
            cmd_stitch(argparse.Namespace(video=src, name=name, out=out_root, turn=None,
                                          floor=floor or None, work=None, keep_work=False))
            done.append(os.path.join(out_root, slug(name)))
        except (SystemExit, Exception) as e:
            print(f"{name} failed: {e}")
    others = [d for d in sorted(glob.glob(os.path.join(out_root, "*")))
              if os.path.exists(os.path.join(d, "pano.jpg")) and d not in done]
    if others and ask(f"\nAlso include rooms made earlier ({', '.join(os.path.basename(d) for d in others)})? [y/N] ")\
            .lower().startswith("y"):
        done += others
    if not done:
        ask("\nNothing was stitched. Press Enter to close.")
        return 1
    html_path = os.path.join(out_root, "tour.html")
    links = []
    while True:
        build_tour(html_path, done, links, "360 tour")
        webbrowser.open("file://" + os.path.abspath(html_path).replace("\\", "/"))
        if len(done) < 2:
            break
        print("\nTo link rooms: in the tour, click a doorway; the bottom corner shows its yaw and pitch.")
        more = ask("Type links like  Bedroom>Hallway@-68,-8; Hallway>Bedroom@-40,-8  (Enter to finish): ")
        if not more:
            break
        links = [l.strip() for l in more.split(";") if l.strip()]
    ask(f"\nSaved in {out_root}. Press Enter to close.")
    return 0


def main():
    use_bundled_tools()
    if len(sys.argv) == 1 or all(os.path.isfile(x) for x in sys.argv[1:]):
        for tool in ("ffmpeg", "ffprobe", "pto_gen", "cpfind", "autooptimiser", "nona"):
            if not shutil.which(tool):
                ask(f"Missing '{tool}'. Keep the 'tools' folder next to pano360.exe. Press Enter to close.")
                return 1
        return interactive(sys.argv[1:])
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="quick triage of a clip (about a minute)")
    c.add_argument("video")
    c.add_argument("--work")
    s = sub.add_parser("stitch", help="stitch one room")
    s.add_argument("video")
    s.add_argument("--name", required=True)
    s.add_argument("--out", default="out")
    s.add_argument("--turn", help="force the turn range, seconds, e.g. 0-11.3")
    s.add_argument("--floor", help="tilt-down range to fill the floor, e.g. 12.9-14.4")
    s.add_argument("--work")
    s.add_argument("--keep-work", action="store_true")
    t = sub.add_parser("tour", help="combine stitched rooms into one tour page")
    t.add_argument("output")
    t.add_argument("scenes", nargs="+", help="output folders (or pano.jpg files) from stitch")
    t.add_argument("--link", action="append", help='hotspot, e.g. "Bedroom>Hallway@-68,-8" (yaw,pitch)')
    t.add_argument("--title", default="360 tour")
    a = ap.parse_args()
    for tool in ("ffmpeg", "ffprobe") + (("pto_gen", "cpfind", "autooptimiser", "nona") if a.cmd == "stitch" else ()):
        if not shutil.which(tool):
            sys.exit(f"Missing '{tool}'. Install ffmpeg, hugin-tools and enblend first (see README).")
    try:
        return {"check": cmd_check, "stitch": cmd_stitch, "tour": cmd_tour}[a.cmd](a)
    except RuntimeError as e:
        sys.exit(f"Failed: {e}")


if __name__ == "__main__":
    sys.exit(main())
