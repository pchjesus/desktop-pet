# Hearts2Hearts Jiwoo — IDLE visual prototype v0.1

Date: 2026-11-03 (KST)  
Status: **UNAPPROVED / experimental animation only**. Not integrated in Electron.

## Inputs and immutable approval state

- Source: approved Jiwoo v1, **cropped-only reference PNG** `characters/jiwoo_approved_v1.png`, 455 × 795 RGBA.
- SHA-256 of source: `c51e84173cc276f0aa89d77c4a6d74877a0fd1954d79f48624f0dcbdb64bb094`.
- Original 3-person lineup: approved and unchanged; source has been taken from the previously prepared 3-person archive.
- Jiwoo v1 remains approved; Jiwoo v1.1 hairline study remains rejected. Sullyoon and Seeun remain locked and unchanged.
- **Only the isolated, already approved Jiwoo crop was animated**. No three-person regeneration, no hairstyle/costume redesign.

## Prototype motion

- 4-second repeating 12 fps motion, **48 frames**.
- Two short eye blinks per loop. Closed lids are an experimental local keyframe, reconstructed from existing surrounding skin colors and manual eyelid curves.
- Very small displacement of the left and right **hair tips only**, maximum about 2 source pixels, with roots remaining fixed.
- No breathing: would require separating shirt, neckline, arms and skin into proper pose layers. Not justified in this first, small prototype.
- No WALK, SIT, SLEEP, DRAG, REACT, idle-state probabilities, or Electron code.

## Visual deliverables (conversation backup only)

- `jiwoo_idle_v0_1_UNAPPROVED.webp` — full-resolution 455×795 animated transparency, 48 frames.
- `jiwoo_idle_v0_1_UNAPPROVED.gif` — reduced white-background preview, 48 frames.
- `jiwoo_approved_v1_vs_idle_v0_1.gif` — two-panel original-static vs animation comparison, 24 sampled frames.
- `jiwoo_idle_eye_keyframes_compare.png` — original eyes and experimental closed-eye keyframe.
- `make_idle_prototype.py`, `blink_refine.py`, `SHA256_MANIFEST.json`, and `README.md` — reproducibility and verification.
- Conversation ZIP: `jiwoo_idle_visual_prototype_v0_1_UNAPPROVED.zip`, including exact approved crop source.

**None of the PNG, GIF, WebP or ZIP binary files are committed to GitHub.** This is a tracking document only.

## Actual checks

- Approved source SHA-256 reverified before image processing.
- First **in-memory RGBA frame** is pixel-identical to the original source.
- Per-frame changes restricted to combined bbox **x=39..426, y=215..392** in the isolated 455×795 Jiwoo crop.
- Pixel values for **y≥402** (shirt/skirt/legs/pose) and **x≥435** are identical to source on all generated frames.
- No alteration of Sullyoon and Seeun because no pixels or assets from them were processed.
- Closed-eye keyframe only alters bbox x=152..355,y=215..293; source alpha is preserved.
- The decoded lossless WebP's first frame matches all original **non-fully-transparent** pixels, including alpha. WebP may normalize hidden RGB values where alpha=0; that has no visible consequence.
- GIF/WebP contain 48 frames; comparison GIF contains 24. ZIP passed CRC integrity validation.
- **Not tested in Windows Electron or packaged EXE**; not a runtime sprite resource yet.

## Review points

1. Are eyes closing naturally, or is the hand-drawn closed eye keyframe insufficiently faithful to the approved artwork?
2. Is tiny hair-tip sway visible and plausible without changing the approved silhouette?
3. Do not approve this animated prototype by implication. Wait for explicit user review before iterating or converting it into app runtime resources.
