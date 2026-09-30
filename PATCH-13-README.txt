v0.1.9 Patch 13 — Growlithe exact-source pixel animation

- Base Growlithe appearance uses the supplied HG/SS 80x80 PNG byte-for-byte.
- WALK uses a 6-frame APNG derived directly from that source: only tiny lower-leg pixel regions are shifted; no redraw/SVG/sprite-sheet CSS.
- REACT uses the supplied 23-frame APNG.
- SLEEP uses the supplied base sprite with only the eye pixels edited into a closed-eye pose.
- Left/right facing continues to follow actual horizontal movement direction.
- Dog behavior and shared Pet Engine are unchanged.
