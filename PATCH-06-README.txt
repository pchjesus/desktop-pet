Desktop Pet v0.1.12 Spheal input regression fix

Root cause / scope:
- The shared Electron mouse-input path had been modified while trying to make Spheal hit testing character-specific.
- The known-good Spheal working build already used the same fixed 110x110 window hit region as Growlithe/Neukgu/Royce.
- This patch restores the exact shared main/renderer input path from that known-good build instead of adding another character-specific hit-test workaround.

Changed:
- Restored src/main.js from the known-good Spheal working build.
- Restored src/renderer.js from the known-good Spheal working build.
- Restored src/index.html from the known-good Spheal working build (removes the later Spheal-only cursor CSS change).
- Kept the current Spheal character implementation with the approved one-shot clap and Water Gun assets.
- Kept the original Spheal base image and existing ROLL assets unchanged.
- Updated the desktop-shell regression assertion to match the restored shared input contract.

Verification:
- JavaScript syntax checks.
- Automated test suite.
- Static comparison against the known-good Spheal working build for the shared input files.
- Actual Windows Electron click/drag/right-click verification is still required.
