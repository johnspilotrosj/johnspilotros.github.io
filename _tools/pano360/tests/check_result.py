#!/usr/bin/env python3
"""Fail if a synthetic-room stitch is worse than it should be (pure rotation, sharp frames)."""
import json, sys

r = json.load(open(sys.argv[1], encoding="utf-8"))
print(json.dumps({k: r[k] for k in ("frames", "coverage_real", "real_up_to_deg", "real_down_to_deg")}, indent=1),
      "\nalignment px:", r["hugin"]["rms_out"])
problems = []
if r["coverage_real"] < 60:
    problems.append(f"coverage {r['coverage_real']:.0f}% < 60%")
if r["hugin"]["rms_out"] > 2:
    problems.append(f"alignment {r['hugin']['rms_out']:.1f}px > 2px")
if r["horizon_gap_deg"] > 1:
    problems.append(f"horizon gap {r['horizon_gap_deg']:.0f}°")
if problems:
    sys.exit("FAILED: " + "; ".join(problems))
print("OK")
