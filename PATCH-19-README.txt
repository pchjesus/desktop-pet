Spheal Patch 19

Visual cleanup based on Patch 18 runtime review.

Changed
- Clap frames: removed lower leg/foot-like protrusions and restored a rounded lower body silhouette.
- Clap eyes: added opaque light eye highlights so the eye appearance does not visually change with the desktop background.
- Water Gun frames: rebuilt firing frames from the clean base body rather than stacking face artwork over an existing face.
- Water Gun mouth: clearly open throughout the firing frames.
- Water stream: one thick continuous column, without the previous multiple-parallel-line appearance.
- Water shake: rebuilt from the clean base body, replaced the original eyes before drawing >< eyes, and strengthened small droplets.

Preserved
- ROLL assets and behavior.
- Base movement / idle behavior.
- Shared Pet Engine.
- Existing input, drag, right-click, settings and persistence behavior.
- Patch 18 one-shot completion fix.

Verification
- Automated test suite should be run before delivery.
- Windows Electron visual verification remains required for final judgment of pixel appearance on actual desktop backgrounds.
