Desktop Pet v0.1.9 patch-02 — Growlithe overworld walk + drag robustness

Apply this patch to the existing v0.1.9-patch-01 source.

Changed files:
- src/characters/growlithe.js
- src/renderer.js
- src/index.html
- src/assets/characters/growlithe-overworld/*.png
- test/growlithe-character.test.js
- test/desktop-shell.test.js
- README.md
- DEVLOG.md

Do not copy node_modules or build artifacts.

Behavior:
- Growlithe WALK uses the supplied HG/SS overworld #058 sprites with four directions and two walk frames per direction.
- Growlithe click reaction still uses the supplied 23-frame source-derived reaction animation.
- Drag uses pointer capture/pointer cancellation and blur cleanup to avoid remaining in drag state after mouse release.
- Existing dog behavior and shared behavior probabilities remain unchanged.
