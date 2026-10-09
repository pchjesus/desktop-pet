Spheal Patch 22 — flipper separation and dynamic single Water Gun stream

Baseline: Patch 21. Patch 21 ZIP is retained separately for rollback.

Changes
- Clap 01-08: only selected pixels within the two existing flipper regions were recolored in muted warm shadow/highlight tones. Their silhouettes, body connections, mouth, eyes, and rounded belly remain unchanged. No new hands or overlay layers were added.
- Water Gun 04-08: left-of-mouth stream region is redrawn in 2–3 coordinated blues, with short moving highlights and 1px silhouette ripples. Each firing frame is distinct. Every stream stays a single continuous thick beam connected to the existing open mouth.

Intentionally unchanged
- All other Spheal assets including base/ROLL, Water Gun 01–03 and 09–12 (shake/return), current mouth/face, all JavaScript, Electron/renderer state, common inputs, storage/settings, and other characters.
- Animation count and timing: 8 clap frames and 12 Water Gun frames; no timing changes.

Validation
- npm run check, npm test, PNG checks/dimension/bounds and frame comparison.
- Transparent eye pixel check and water connectivity/unique frame checks.
- White/dark background contact-sheet inspection.
- Actual Windows Electron run and visual acceptance remain manual.

Manual verification
- Choose Spheal in the Windows Electron app. Click to clap; both flippers should remain distinguishable while attached to the body. Inspect over bright and dark desktops.
- Click Spheal, then type watergun and Enter within the input window: confirm open mouth remains identical to Patch 21 and the stream appears thick, one-piece, and flowing through frames 04–08.
- Confirm water disappears before shake in frames 09–11. Check ROLL, dragging, right click and normal idle/movement for regressions.
