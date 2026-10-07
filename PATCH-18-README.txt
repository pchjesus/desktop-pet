Desktop Pet v0.1.12 - Spheal Patch 18

Changed
- Rebuilt clap frames to restore base-like on-screen height and remove the old lower-flipper protrusion silhouette.
- Preserved full-body pixel frames; no separate eye/mouth/hand overlay was introduced.
- Thickened Water Gun to a single ~3x stream while keeping it within the opened-mouth height.
- Water Gun now overlaps the mouth cavity so the stream visually begins inside the mouth.
- Kept the mouth visibly open through all main firing frames (04-07).
- Strengthened small pixel droplets in the shake frames (09-11), preserving the existing shake body motion and >< expression.
- Spheal click reaction now waits for the one-shot special animation to finish before returning REACT -> IDLE, instead of being cut off by the shared 800 ms click timer.

Preserved
- v0.1.12(2) baseline behavior outside the localized Spheal patch.
- ROLL frames and roll logic.
- Shared Pet Engine.
- Existing movement/idle/drag/right-click/settings/save behavior.
- Patch 17 source ZIP remains untouched as rollback baseline.

Verification status
- Syntax/tests: run after packaging.
- Asset dimensions/bounds: checked after generation.
- Actual Electron visual/UX verification: still requires the Windows desktop runtime/user visual check.
