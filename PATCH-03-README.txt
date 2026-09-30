Desktop Pet v0.1.9 patch04 — Growlithe motion revision

Changes:
- Growlithe now follows the dog's left/right-facing desktop-pet model.
- Removed four-direction overworld switching.
- WALK uses the HG/SS Growlithe overworld left/right 2-frame sprite with a slower step cadence and subtle body bob.
- IDLE/SIT/DRAG/SLEEP use the original HG/SS animated 80x80 sprite resource.
- REACT uses the dedicated Growlithe reaction animation.
- Existing dog character, Pet Engine behavior probabilities, drag interaction, and Easter egg flow are preserved.

Validation:
- 31/31 tests passed
- npm run check passed

This patch intentionally excludes node_modules and dist.
