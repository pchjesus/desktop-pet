Spheal patch 09

Fixed:
- Restored the original Spheal base dot as the runtime/startup artwork instead of the alternate idle artwork.
- Normalized non-transparent base pixels to opaque pixels so body highlights/white spots do not composite differently against light and dark backgrounds.
- Rebuilt the clap and Water Gun frame PNGs from the supplied sprite sheets by removing neighboring-frame/source-sheet artifacts while preserving the existing motion forms.
- Removed stray source-sheet text/artifacts from Water Gun frames.
- Slowed clap playback to 140 ms/frame (1.12 s total) and Water Gun to 160 ms/frame (1.28 s total).

Not changed:
- ROLL artwork/playback.
- Shared Pet Engine/input architecture.
- Existing character behavior.

Verification:
- Automated tests and JS syntax checks required before Windows GUI verification.
- Actual Electron/Windows visual verification remains required.
