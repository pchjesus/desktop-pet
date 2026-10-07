Desktop Pet v0.1.12 Spheal Patch 10

Purpose
- Replace the previous Spheal clap and Water Gun frame sets with newly constructed fixed-position animations.
- Preserve the original Spheal base pixel artwork while removing stray red/yellow/green pixels and making the eye regions explicitly opaque white/black pixels.
- Slow the special-action playback so the motion is easier to see.

Changes
- spheal-base.png: original base artwork retained; only eye transparency and obvious stray saturated artifact pixels were corrected.
- animations/clap/: 7-frame fixed-position clap animation using the two front flippers only.
- animations/watergun/: 7-frame fixed-position Water Gun animation with a straight horizontal water effect.
- src/characters/spheal.js: uses the new animation paths and 180 ms clap / 200 ms Water Gun frame timing.
- Existing roll animation and shared Electron input structure are unchanged.
- Previous animation files remain in the project for rollback/reference but are no longer used by SphealCharacter.

Verification
- Full Node test suite: 52/52 passed.
- JavaScript syntax check: passed.
- Asset verification: base contains no obvious saturated red/green/yellow artifact pixels; defined eye regions are fully opaque; all new frames are 80x80.
- Actual Electron/Windows visual verification: not performed in this environment.
