# pano360

Turns an iPhone room video (turning in place) into a 360° panorama, and several rooms into one
clickable tour. No Claude needed.

## Easiest: run it on GitHub (nothing to install)

1. Share each video on Google Drive as **Anyone with the link**.
2. On GitHub, open this repo → **Actions** → **360 tour** → **Run workflow**.
3. Fill in:
   - **Rooms**: `Bedroom=https://drive.google.com/file/d/XXX/view; Hallway=https://drive.google.com/file/d/YYY/view`
     - add `floor=12.9-14.4` after a link if you filmed a tilt-down at that time (fills the floor)
     - add `turn=0-11` to force which seconds are the turn, if the automatic choice is wrong
   - **Links** (optional): `Bedroom>Hallway@-68,-8; Hallway>Bedroom@-40,-8`
   - **Title**: anything
4. Wait about 10–20 minutes. Rooms are stitched at the same time, side by side.
5. Open the finished run → **Artifacts** → download **tour**. Inside:
   - `tour.html`: the whole tour in one file; open it in any browser
   - `<room>/pano.jpg`: 4096×2048 equirectangular panorama for each room
   - `<room>/report.json`: coverage, alignment error and warnings
   - `<room>/contact.jpg`: a frame every 0.5 s, for picking `turn=`/`floor=` times by hand

**Placing links:** run once without links, open `tour.html`, click the doorway you want to link from, and
the bottom-right corner shows `yaw` and `pitch`. Put those in `From>To@yaw,pitch` and run again.

## On your own computer

Needs ffmpeg, Hugin's command-line tools and enblend, plus Python 3:

```
# Ubuntu / WSL
sudo apt install ffmpeg hugin-tools enblend
pip install opencv-python-headless numpy pillow

python3 pano360.py check  "https://drive.google.com/file/d/XXX/view"     # 1-minute triage
python3 pano360.py stitch "https://drive.google.com/file/d/XXX/view" --name Bedroom --floor 12.9-14.4
python3 pano360.py tour tour.html out/bedroom out/hallway --link "Bedroom>Hallway@-68,-8"
```

## Filming so it stitches well

- Stand in one spot and don't move your feet. Turn the phone around the lens, not around your body.
- 4K, 0.5× lens, **25–30 seconds per full turn**. Faster turns blur.
- Lock exposure first (long-press the screen).
- One level turn, then a turn tilted down (or a tilt-down at the floor), from the **same spot**.
- Run `check` first; it tells you in a minute whether the clip is worth stitching.
