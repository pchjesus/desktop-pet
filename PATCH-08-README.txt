PATCH-08 — Spheal visual/special-action resource correction

Root cause / findings:
- The normal Spheal base used by the desktop pet and startup card was `spheal-base.png`, which is the first ROLL frame rather than the intended normal idle artwork. Its eye rendering is visibly different on a white background.
- The approved Spheal handoff specifies an 8-frame front-flipper reaction/clap and an 8-frame straight Water Gun sequence, but the current implementation used only 6 clap frames and 7 Water Gun frames from alternate animation folders.
- The Water Gun PNG extraction contained unrelated dark text/glyph pixels in the top margin. Those artifacts were part of the image files, not Electron/CSS rendering.
- Special playback logic is already finite: it computes a frame index without modulo and finishes when the last frame is reached. This patch preserves that behavior and adds explicit regression assertions rather than introducing a new animation loop system.

Changes:
- Use `spheal-idle.png` as Spheal's normal/base sprite.
- Use `spheal-idle.png` on the startup character-selection card.
- Restore the approved 8-frame `react-01..08.png` sequence for the clap/reaction action.
- Restore the approved 8-frame `watergun-01..08.png` sequence for Water Gun.
- Remove only the stray top-margin text components from the 8 Water Gun PNGs; character, water stream, splash and other action pixels are retained.
- Keep the ROLL frames unchanged.
- Keep the existing one-shot special-action playback architecture unchanged.

Regression scope:
- Existing shared Electron input code is unchanged.
- Existing Spheal movement/direction and ROLL assets are unchanged.
- Existing Neukgu/Growlithe/Royce code paths are unchanged.

Verification:
- Static source inspection and asset dimensions.
- JavaScript syntax checks.
- Spheal unit/contract tests updated for the 8-frame approved resources and idle base.
- Actual Electron/Windows visual verification is still required for final acceptance, especially clap one-shot behavior, Water Gun one-shot behavior, white-background appearance, and existing character regression.
