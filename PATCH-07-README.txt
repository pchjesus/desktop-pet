PATCH-07 — Spheal input coordinate root-cause fix

Root cause:
- Spheal's DOM node was inserted after the closing #pet element in src/index.html.
- Electron hit-testing is based on the #pet element's central 110x110 area.
- Because Spheal was outside #pet, its visual position did not share the same renderer coordinate origin as the clickable #pet area.
- This produced the observed offset: the actual Spheal appeared lower/left while the clickable area remained upper/right.

Fix:
- Move only the Spheal DOM node inside #pet.
- Do not change main.js hit-testing, BrowserWindow geometry, or the shared pointer/drag implementation.

Expected impact:
- Existing Neukgu/Growlithe/Royce input logic remains unchanged.
- Spheal visual position and #pet hit-test coordinate space now share the same DOM parent.

Verification performed:
- Compared patch06 against stable 0.1.12.
- Confirmed main.js shared hit-test code is unchanged from stable.
- Confirmed the malformed DOM nesting is the only cause needed to explain the observed upper-right hit area.
- JavaScript syntax and structural checks should be run before Electron runtime verification.

Manual verification still required:
- Actual Electron/Windows: Spheal click, drag, right-click, movement, screen-edge behavior.
- Regression: Neukgu/Growlithe/Royce click, drag, right-click and autonomous movement.
