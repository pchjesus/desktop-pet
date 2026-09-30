Desktop Pet v0.1.8 patch-09 — Startup screen + manual

Apply this patch to the existing v0.1.8-patch-08 source.

Changed files:
- src/main.js
- src/start.html
- src/start-preload.js
- src/manual.html
- test/desktop-shell.test.js
- README.md
- PROJECT_SPEC.md
- DEVLOG.md

Do not copy node_modules or build artifacts.

Behavior:
- Normal launch opens the startup screen.
- 설명서 opens a separate manual window.
- 시작 closes the startup screen and launches the existing dog pet.
- --smoke-test bypasses the startup screen so the existing packaged smoke check still works.
- Existing dog visual/behavior code is unchanged.
