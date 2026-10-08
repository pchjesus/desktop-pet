Spheal Patch 21 — clap anatomy and Water Gun mouth position

Based on: v0.1.12 Spheal Patch 20, preserved as the rollback ZIP.

Changed
- Reconstructed all 8 Spheal clap full-body frames from one clean rounded body and facial reference; no additional hand/eye/mouth DOM overlays.
- Existing lower flipper silhouettes and blocky central belly patches were excluded from the clean base; exactly two connected flipper shapes are drawn in each pose.
- Corrected clap eye region transparency artifacts by preserving consistent opaque eye pixels; checked light and dark backgrounds.
- Moved the big open mouth upward into the original Spheal muzzle on Water Gun frames 04-08, keeping one 10px high contiguous water stream entering the mouth interior.
- Kept water shake 09-11 untouched, preserving the > < eyes and droplets.
- Removed duplicated stale CSS keyframe declarations that remained after the water recoil animation.

Deliberately unchanged
- Spheal base, ROLL, movement, idle, other character assets, shared Pet Engine, inputs, settings and persistence.
- JS state transitions, Water Gun 01-03/09-12 frames, timings and clap frame count.

Validation
- Run npm run check and npm test.
- Inspect key poses and eye alpha on both white and dark backgrounds.
- Verify all Water Gun firing frames retain a thick single stream through the mouth, and all shake frames have no stream.
- Windows Electron visual review remains manual and necessary.
