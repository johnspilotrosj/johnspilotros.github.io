---
name: iphone-360-stitch
description: Stitch a 360° equirectangular panorama (virtual tour photo) from an iPhone video or photo set of a room, using Hugin + enblend + OpenCV, and show it in a Pannellum viewer. Use when the user shares a room video/photos for a 360 tour, asks to stitch a panorama, or asks how to film one.
---

# iPhone video → 360° panorama

The user shoots rooms for real-estate virtual tours on an iPhone 16 Pro (0.5× ultrawide,
4K 60 fps, portrait, HDR HLG) instead of a 360 camera. They want speed and blunt honesty
about stitch quality.

## Lessons from the first run (do not repeat these)

1. **Be fast.** The user had to say "be quicker". Do not run open-ended experiments
   (extra lens models, repeated heatmaps). Use the known-good settings below, check the result
   once, and deliver. Report progress in one short line.
2. **Use the same deliverable locations every time.** Last time the user had to ask "where is the file".
   Write outputs to `scratchpad/out/`, send them with SendUserFile right away, and say
   in the reply that the cloud scratchpad is deleted after the session. Offer to save them to their Google Drive
   or the repo.
3. **enblend/nona output is cropped (`r:CROP`).** Read the TIFF XPosition/YPosition tags
   (tags 286/287 × 150 dpi) and paste onto the full 8192×4096 canvas *before* measuring
   coverage or pitch. The first coverage number was wrong because of this.
4. **Cap fill must never leave a seam.** It took three tries to get rid of a dark line. Do it right the first time:
   erode the stitched alpha ~41 px at 8192 width, erode the fill-source mask in the cube face
   (3×3, 6 iterations), and build the final blend weight as
   `blur(erode(alpha, 101 px), σ=14)` so it is zero outside real pixels.
5. **Ghost/disagreement maps:** remove the local mean with a *mask-normalised* blur
   (`blur(g*m)/blur(m)`) on eroded masks. A plain blur makes every frame border light up.
6. **Frame selection:** use the spacing-constrained DP (`select2.py`, 12–21° steps, sharpness
   relative to the local median). Greedy per-window picking gave 5° and 28° gaps.
7. **Hugin per-image params:** if you unlink `v` per image, give each image a real starting FOV
   (`v0` = "Field of View must be positive"). Better: skip it. Per-image `d,e` + `g,t` is enough.
8. Pipe Hugin output through `grep -v EXIF`, because the "Unable to read EXIF" spam floods the log.
9. **Triage the clip first (second run, hallway).** If the spin is faster than about 50°/s (steps over 5° per
   0.1 s in `motion.py`), and the median full-res Laplacian sharpness is under about 15, tell the user up front
   that the clip will stitch badly and ask whether to proceed or reshoot. Last time I spent about 40 minutes and still got a draft.
10. **Never bridge Hugin groups with loose SIFT matches** on white walls or door frames. They are false
    and gave 152 px RMS, and 7k control points made autooptimiser hang. Use `scripts/ecc_link.py` (ECC on
    gradient images between neighbouring frames) and keep only links with ECC ≥ 0.9.
11. Drop near-blank frames (no control points) before optimising. Wrap every `autooptimiser` call in `timeout`.
12. If enblend fails ("mask is entirely black"), use `verdandi --wrap` instead of retrying enblend.
13. A horizon gap with no frames stays black after the cap fill. Fill it too, and report its width in degrees.
14. "Click between viewpoints" means a Pannellum multi-scene tour with `type:"scene"` hotspots
    (see the tour page structure in this repo's history). Put each scene's quality notes next to it.

## Known-good pipeline (about 6–8 minutes total)

Tools: `apt-get install -y hugin-tools enblend` and `pip install opencv-python-headless numpy`
(neither was preinstalled). ffmpeg has `zscale` + `tonemap`.

1. **Download** the Drive file with
   `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`.
2. **Tone-map HLG → SDR** (needed on every iPhone HDR clip):
   `zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=pc,format=rgb24`
3. **Find the turn in place:** extract 10 fps at 540×960 into `ana/`, then run `scripts/motion.py ana motion.json`.
   Pure rotation shows a median residual under about 1 px. Walking or stepping shows 2 px or more with a small rotation step.
   Confirm with `scripts/pair.py`: across passes, a pure-rotation fit with ≥50% of points within 2 px means
   the same spot. Anything at 10 px or more is a different position and must be excluded (it ghosts).
4. **Sharpness:** run `scripts/sharp.py tm.txt video.MOV sharp.json` on full-res frames (adjust its `-t` to the segment end).
5. **Select** with `scripts/select2.py` → `selected.json` (frame numbers at 59.94 fps).
6. **Extract** the selected frames with `select='eq(n\,N)+…'`, tone-map, `-q:v 1`.
7. **Hugin:**
   - `pto_gen -p 0 -f 68` (short-side HFOV for 4K video on 0.5×; it optimises to about 63°)
   - `cpfind --multirow --sieve2size=4` → `cpclean`
   - optimise `y,p,r,v,a,b,c,d,e` (anchor image 0), then per-image `d,e` (EIS crop shift) and
     `g,t` (rolling shutter); the last run reached about 4 px RMS at 2160 wide, roughly 1.3 px at 4096 output
   - `autooptimiser -m` (photometric)
   - `pano_modify --projection=2 --fov=360x180 --canvas=8192x4096 --straighten --center`
   - `nona -m TIFF_m` → `enblend --wrap=horizontal`
8. **Finish:** `scripts/finish.py`, run from the stitch dir, places the stitch on the canvas, fills the caps via
   cube-face push-pull, resizes to 4096×2048 and saves JPEG q80. It also writes a real-pixels-only version.
9. **Viewer:** start from `scripts/viewer_template.html`, inline Pannellum 2.5.6 CSS from cdnjs and load the
   JS from cdnjs. **Update the numbers and flaws in the notes to the new room.** Publish as an
   Artifact with both JPEGs in `files`.

## Honesty checklist for the reply

- Which time range was used, and why the other ranges were excluded (with residual numbers).
- Real coverage in degrees and % of sphere. Say plainly which areas are filled in, not real.
- Specific seams, ghosting and blur by object, taken from a zoom check and the ghost map.
- Filming advice: one fixed spot (tripod, rotate around the lens), level + ±45° passes +
  straight up/down, 25–30 s per lap or 0.5× stills, AE/AF lock, Standard stabilization.

A single level lap of 0.5× portrait video only reaches about +35° to −55°. The ceiling and floor
need separate passes from the **same** spot.
