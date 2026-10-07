Desktop Pet v0.1.12 — Spheal Patch 12

Changed
- Kept the patch07-known-good spheal-base.png as the visual baseline.
- Fixed the confirmed background-dependent eye defect by filling only 45 transparent internal pixels belonging to the two eye regions.
- The fill uses nearby existing opaque pixels from the same eye region; no new artwork, color palette, ROLL frames, JS, renderer, common input, or other character code was introduced.

Not changed
- ROLL assets and playback.
- Spheal movement, click, drag, right-click, common input handling, renderer, Pet Engine, or other characters.
- The outer pixel-art edge itself was not smoothed in this patch. The newly reported white-background jagged edge remains a separate visual issue because smoothing it would change the character's pixel-art rendering style.

Verification target
- On white and dark backgrounds, the two eye interiors no longer reveal the window background.
- RGB values of all untouched pixels remain identical to the patch07 baseline.
- Start-screen/base image continues to use spheal-base.png.
- npm test and npm run check pass.
- Actual Electron/Windows visual verification remains required.
