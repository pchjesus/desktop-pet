Spheal Patch 23 — visual polish of CLAP and WATER GUN

Baseline
- Patch 22 main: 661e7c5a87280056f4487cf209bdc9ee9adbf15e
- Patch 21 flipper reference: fcadadbffb9e8fda35f3fcd1b619a401d5d6d729

Implemented
1. CLAP 01–08: reset the extensive warm horizontal shadow from Patch 22 to the clean Patch 21 baseline. Add only four short cream-tone diagonal crease pixels per side on CLAP 03–06 (8 pixels/frame), retaining exactly the same two original flippers, face, round belly, pose timing and one-shot behavior. CLAP 04–05 remain intentionally identical.
2. WATER GUN 04–08: replace flat leading cutoffs with stepped/tapered tips, small edge ripples and moving short blue high/low-light dashes. A single thick connected jet is retained; frame 06 no longer occupies the x=0 crop edge. The firing mouth and body x>=33 remain pixel-identical to Patch 22.
3. Visual references: docs/spheal-patch23/clap-contact-sheet.png and watergun-contact-sheet.png (top: light background, bottom: dark background), plus COMPARISON.md.
4. NO edits to WATER GUN 01–03 or 09–12 (including shake, >< eyes or droplets), Spheal base, ROLL, shared JS/state/input, other character assets or Electron settings.

Verification performed
- PNG RGBA 80x80 clap / 120x80 water; source pixel comparisons.
- Target-region masks for modified watergun frames; unchanged firing mouth/body side.
- Short tapered outer beam tip checks and continuous stream pixels per column.
- PNG encode/decode round-trip checks, light/dark background contact sheet preview.
- Git commit file-scope comparison; unmodified JS/ROLL/other assets.

NOT YET VERIFIED
- npm run check and npm test were NOT executed. Patch 22's previous 53/53 tests must NOT be reported as Patch 23 test results.
- Windows Electron visual smoothness and any packaged EXE are NOT tested. The visually improved result needs manual approval on the actual desktop.

Windows manual review
- On GitHub, Code > Download ZIP; unzip. If first run, INSTALL-WINDOWS.bat; then RUN-WINDOWS.bat.
- Select Spheal; click it to inspect CLAP 01–08, especially the independent flipper folds at 03–06, belly and face on light/dark desktop backgrounds.
- Click Spheal and type watergun, Enter within the enabled time window. Check five firing poses, unchanged open mouth, single thick jet and tapered moving cap, no clipping at the stream end, then water completely disappears before shake.
- Confirm >< eyes, shake and droplets, ROLL, mouse click/drag/right click, idle/autonomous move, other characters.
- For EXE, rebuild through BUILD-WINDOWS.bat; old EXE will NOT auto-update.

Rollback
- GitHub commit 661e7c5a87280056f4487cf209bdc9ee9adbf15e is the previous Patch 22 tree. Patch 21 and full stable v0.1.12(2) history are preserved.
- GitHub commit tree used for Patch 23 updates only the listed Spheal PNGs and documentation.
