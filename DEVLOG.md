# DEVLOG — v0.1.8-patch-01

### Added
- Introduced the first lightweight character-system boundary with `src/characters/dog.js`.
- Registered the existing dog as `DogCharacter`.
- Added focused character tests for state-to-animation-class mapping and facing behavior.

### Changed
- Renderer no longer directly owns the dog element's state classes or facing animation.
- Existing dog SVG/CSS, Pet Engine, Main process, and preload IPC contracts were preserved.
- Added the dog character script to the renderer load order without redesigning the existing asset.

### Fixed / Risk review
- Reduced renderer coupling to the current `wolf` DOM implementation so future characters can provide their own visual behavior.
- Kept OS window movement, drag handling, click-vs-drag classification, speech bubble behavior, autonomous movement, and shared state ownership in their existing layers.

### Validation
- Node test suite: 21/21 passed.
- JavaScript syntax checks: passed for main, preload, renderer, pet-engine, and dog character.
- Windows Electron GUI runtime was not available in this environment; packaged/manual GUI validation remains required on Windows.

### Next
- Add the common character contract only as future characters require it; avoid speculative abstraction.
- Later, extract configurable behavior probabilities into a separate behavior configuration so a developer-facing tuning tool can edit them safely.
- Do not implement Pachirisu, Cheese Cat, character selection UI, or the probability editor in this patch.

# v0.1.4

### Fixed / strengthened
- Identified the actual Windows build blocker: the Electron package was installed but its `dist` directory was missing, so `npm rebuild electron` did not produce the runtime under the current npm install-script approval behavior.
- Replaced the rebuild fallback with an explicit `node node_modules/electron/install.js` preparation step, invoked through `scripts/prepare-electron.js`. This makes the Electron runtime preparation explicit instead of relying on npm lifecycle-script execution.
- Kept the existing desktop application source and behavior unchanged.
- Updated the Windows build to verify the Electron distribution before running tests or electron-builder.
- Updated artifact checks and smoke-test paths to v0.1.4.

### Validation status
- Cross-platform unit/static tests: run after this patch.
- Actual Windows Electron download/build/runtime still requires the user's Windows environment; this environment cannot execute a Windows GUI executable.

## v0.1.3

### Fixed / strengthened
- Confirmed the `[3/3] Starting Desktop Pet...` output belongs to `INSTALL-WINDOWS.bat`, the development-run helper, not the portable EXE build flow.
- Added an Electron runtime preflight so the build cannot silently proceed with a missing Windows Electron binary.
- If the Electron binary is missing, `BUILD-WINDOWS.bat` attempts `npm.cmd rebuild electron` before failing.
- Added desktop-shell regression tests for transparency, always-on-top behavior, click-through IPC, click/drag classification, movement loop, and existing IPC surface.
- Added an explicit portable EXE artifact existence check after electron-builder completes.
- Added `VERIFY-WINDOWS.bat` to repeat regression checks and launch the packaged EXE for a short Windows process smoke test.
- Kept the existing MVP behavior and architecture unchanged; no product behavior was intentionally removed.

### Validation status
- Node unit tests: expected to run cross-platform.
- JS syntax checks: cross-platform.
- Desktop-shell contract tests: static regression checks; they do not replace Windows GUI validation.
- Actual Windows EXE build/runtime: must be validated on Windows because this environment cannot execute a Windows GUI binary.

## v0.1.2

- Fixed Windows `.bat` control flow: `npm.cmd` invocations now use `CALL` so the parent build/run script resumes after npm completes.
- Added a regression assertion requiring `CALL npm.cmd` in Windows helper scripts.
- Bumped package version to `0.1.2`.
- This patch addresses the observed behavior where `[1/4] Installing dependencies...` completed successfully but the build script returned to PowerShell before step 2.

# DEVLOG — v0.1.0

## Added
- Electron desktop overlay architecture
- Main/renderer separation
- Click-through handling
- Drag handling
- Work-area clamping
- Minimal behavior engine
- Automated pure-logic tests

## Changed
- Moved away from browser-only HTML prototype toward a desktop application model.

## Known Issues
- Final sprite/art is not implemented.
- Tray icon is not yet implemented because no final project icon asset exists.
- Full Electron build has not been executed in this environment; Windows packaging is intended to run on the user's Windows machine.
- Multi-monitor behavior is only partially prepared; work-area clamping currently follows the display nearest the cursor.

## Next
- Verify Windows overlay behavior.
- Add proper original Minecraft-inspired wolf sprite sheet.
- Replace simplistic random behavior with a richer state/behavior controller informed by open-source implementations.
- Add regression tests for click/drag/click-through interactions.
- Add tray menu and optional startup behavior.


## v0.1.1

### Fixed
- Changed Windows scripts to call `npm.cmd`, avoiding PowerShell execution-policy issues when launched from PowerShell.
- Configured electron-builder to use the Electron distribution already installed under `node_modules/electron/dist`, avoiding a redundant Electron ZIP download during the Windows build.
- Simplified the default build target to the portable EXE for the first MVP; the NSIS installer remains available through `npm run dist:installer`.
- Added an author field to remove the electron-builder metadata warning.
- Added `RUN-WINDOWS.bat` for a simple development launch.

### Known limitations
- The current artwork is still a temporary placeholder.
- Dragging and click-through behavior still require Windows runtime verification.


## v0.1.5
- Pinned Electron 44.5.0 and electron-builder 26.0.12 for reproducible builds.
- Replaced ad-hoc Electron install.js invocation with the official install-electron helper.
- Strengthened Electron preflight to detect partial/missing distributions.
- Added renderer mousemove regression coverage and window-level drag continuity.
- Updated build/verify artifact names and documentation.
- Re-ran source tests and syntax checks before packaging the source archive.


## v0.1.6

- Fixed Electron runtime preparation: execute the installed Electron package's `install.js` directly with the current Node executable instead of relying on a Windows `.cmd` wrapper lookup.
- Added Windows Electron runtime execution preflight using `electron.exe --version` before packaging.
- Added packaged smoke-test readiness marker so the EXE verification checks that the renderer actually finishes loading, not merely that the process remains alive.
- Added a main-process drag safety timer based on `screen.getCursorScreenPoint()` so dragging remains robust if renderer mousemove delivery is interrupted.
- Added integration tests for the Electron preparation script.
- Re-ran the full source test suite and syntax checks after packaging the source tree.

# v0.1.8-patch-07 — Quit interaction

### Added
- Added a right-click context action on the pet body that requests application shutdown.
- Added a minimal `pet:quit` IPC route from renderer → preload → Electron main process.
- Documented normal, forced, and development shutdown methods.

### Impact / regression review
- Left-click click-vs-drag behavior remains unchanged.
- Transparent/empty areas remain click-through; the quit action is available only when the pet body receives the right-click.
- No changes to the behavior engine, character system, window movement, or autonomous movement logic.

### Validation
- Static regression test added for the quit IPC path and right-click handler.
- Existing desktop-shell tests and syntax checks should be re-run.
- Packaged Windows GUI behavior requires final validation on Windows.

### Known limitation
- There is still no system tray menu. If the pet body cannot be reached, Task Manager remains the fallback forced-exit method.


## v0.1.8-patch-08

### Changed
- 우클릭 종료를 즉시 종료에서 확인창 방식으로 변경
- 종료 확인창: `종료할까요?` / `확인` / `취소`
- Electron main process에서 `dialog.showMessageBox`로 종료 확인을 처리

### Fixed
- 우클릭 오동작으로 펫이 즉시 종료될 수 있던 UX 문제

### Test
- 기존 테스트에 종료 확인창 및 IPC 계약 검증 추가


# v0.1.8-patch-09 — Startup screen and manual

### Added
- Added a startup screen with **시작** and **설명서** buttons.
- **시작** closes the startup screen and launches the existing dog pet without changing its behavior engine or character visuals.
- **설명서** opens a separate manual window containing the finalized user manual.
- Added `start-preload.js` as a small IPC bridge for the startup screen.
- Added static regression coverage for the startup/manual flow.

### Impact / regression review
- Dog SVG/CSS and `DogCharacter` were not changed.
- `pet-engine.js` was not changed.
- Existing pet drag, click, autonomous movement, click-through, and quit-confirmation paths remain in the pet window.
- Packaged smoke mode bypasses the startup screen so the existing renderer-readiness check remains meaningful.

### Validation
- Automated tests and syntax checks should be run after applying this patch.
- Final startup/manual visual behavior should be checked on Windows together with the existing pet regression checklist.
