# v0.1.12 — Neukgu naming update

- Renamed the default character from the generic `Dog`/`dog` identifier to **Neukgu / 늑구** in the current character system, startup screen, manual, renderer, tests, and documentation.
- Renamed the character module to `src/characters/neukgu.js` and the class to `NeukguCharacter`.
- Kept Growlithe, Royce, Pet Engine, IPC, movement, drag, and Easter egg behavior unchanged.
- Included the final Royce preview resource fix from the v0.1.11 refinement.
- Current character set: **늑구(Neukgu), 가디(Growlithe), 로이스(Royce)**.
- Royce retains five click reactions and the `royce` → `우재민 화이팅!` Desktop Pet popup Easter egg.
- Automated tests: 41/41 passed before release packaging.
- Windows Portable EXE and major GUI interactions were manually verified on the user's Windows environment.
- v0.1.12 is the current release candidate for the Windows Portable GitHub Release.
- Historical DEVLOG/PATCH entries retain their original terminology so the development history remains traceable.

# v0.1.11 — Royce visual and popup refinement

- Slimmed Royce's front legs in the existing SVG-based character resource without changing the shared character structure.
- Replaced the Royce native Electron message box with a dedicated `royce-message.html` BrowserWindow, reusing the existing desktop-window approach used by the project.
- Kept the `royce` Easter egg trigger and `우재민 화이팅!` message unchanged.
- Existing Dog/Growlithe behavior and the shared Pet Engine remain unchanged.

## Validation

- Automated tests: 41/41 pass.
- Windows GUI validation: still required before treating v0.1.11 as stable.

# DEVLOG — v0.1.9-patch-02

### Changed
- Replaced the Growlithe WALK presentation with the supplied HeartGold/SoulSilver overworld #058 sprites.
- Added direction-aware 2-frame pixel-art walk sheets for down/left/right/up.
- Growlithe now chooses the overworld direction from its actual movement vector while the existing shared movement engine continues to own movement and probabilities.
- Growlithe click reaction continues to use the supplied 23-frame animation-derived reaction sheet.
- Reworked drag input to Pointer Events with pointer capture, pointer cancellation, and window-blur cleanup so releasing the mouse does not leave the pet stuck in drag state.

### Risk review
- DogCharacter and Pet Engine behavior probabilities were not changed.
- OS window movement remains main-process-owned.
- The existing click-vs-drag threshold and Growlithe Easter egg flow remain intact.
- The supplied overworld sprites are 32×32 source assets; they are scaled with nearest-neighbor rendering inside the existing Growlithe visual layer to preserve pixel edges.

### Validation
- Node test suite: 31/31 passed.
- JavaScript syntax checks: passed.
- Windows GUI runtime still requires manual validation on the user's Windows environment.

### Next
- Verify the visual feel of the four-direction walk animation and click reaction on Windows.
- If needed, tune only animation timing/scale; do not replace the supplied source sprites without a UX decision.

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


# v0.1.9 — Growlithe character expansion

- Added character selection to the startup screen for the existing dog and Growlithe.
- Added `GrowlitheCharacter` without changing the shared Pet Engine state probabilities or OS window/drag ownership.
- Added local HG/SS Growlithe 80×80 static sprite and the supplied 23-frame animated PNG as the click-reaction resource.
- Kept the original dog DOM/character implementation intact and added regression tests for both character modules and selection flow.
- Added the Growlithe-only `pocketmon` + Enter fan-project Easter egg, armed only after a normal Growlithe click so it does not interfere with click-vs-drag handling.
- Added the fan-project information window using the previously agreed wording.
- Automated tests and JavaScript syntax checks are required before the Windows GUI validation step.


# v0.1.9-patch-01 — Growlithe sprite animation

### Changed
- Replaced the Growlithe-only parent bounce/position animation with actual pixel-art frame animation inside the character layer.
- Derived a 22-frame idle/walk sprite sheet from frames 0–11 of the supplied 23-frame HG/SS animation, mirrored into a ping-pong loop to avoid the original final 2.5-second hold.
- Derived a 10-frame reaction sprite sheet from frames 12–21 for a deterministic click reaction.
- Kept the original static PNG and supplied animated PNG in the project as source assets.
- Kept facing direction on the outer character element so sprite animation cannot overwrite the shared left/right facing transform.

### Impact / regression review
- Pet Engine state probabilities and movement logic were not changed.
- DogCharacter and the dog SVG were not changed.
- Drag/click classification, window movement ownership, and Growlithe Easter egg input flow were not changed.
- Growlithe sleep still uses the original static frame with a small positional breathing effect; the supplied source animation does not contain a dedicated closed-eye sleep pose, so no artificial eye pixels were added.

### Validation
- Full automated test suite: 30/30 passed.
- JavaScript syntax checks: passed.
- Final Windows GUI validation remains required on the user's machine.

# v0.1.9 — Stabilization baseline

## Added
- Established `v0.1.9 Growlithe ExactPixel` as the current working baseline after Windows GUI validation by the user.
- Added a shared character-contract regression suite for `DogCharacter` and `GrowlitheCharacter`.
- Added `CHARACTER-RESOURCE-RULES.md` to record the project-wide character resource policy.

## Character contract
- Shared minimum interface: `setState()`, `setFacing()`, `render()`.
- Character-specific methods are optional and must not be added to `PetEngine`.
- Current Growlithe-specific `setMovementDirection()` remains an optional character capability used by the renderer.

## Resource policy
- Use verified original character resources as the visual baseline.
- For new motions, edit the original pixels minimally rather than redrawing a visually similar replacement.
- AI-generated images are reference material only, not the default final character asset.
- Validate each animation state incrementally before expanding to the next state.

## Validation
- Full automated test suite: 38/38 passed.
- JavaScript syntax checks: passed.
- Windows GUI behavior already validated by the user for the current Growlithe baseline: character selection, Growlithe movement animation, facing direction, drag, click reaction, sleep presentation, and `pocketmon` Easter egg.

## Next
- Keep the `v0.1.9 Growlithe ExactPixel` behavior stable.
- Begin Pachirisu work in a new development phase after this baseline remains unchanged.


# v0.1.10 — Royce character

## Added
- Added the `Royce` character using the existing dog character structure and a black/tan visual treatment based on the supplied reference photos.
- Added Royce to the startup character selection.
- Preserved the existing dog click reactions and added `화이팅!` and `보고 싶어!`, for five total Royce click reactions.
- Added the Royce-only `royce` + Enter Easter egg, which opens a native Electron message box displaying `우재민 화이팅!`.
- Added startup-screen guidance for the Growlithe and Royce Easter eggs.

## Impact / regression review
- Pet Engine state selection and movement math were not changed.
- Existing Dog and Growlithe character modules were not changed.
- Existing click-vs-drag classification remains unchanged; the Royce Easter egg uses the same post-click arming model as Growlithe.
- Main/IPC changes are limited to accepting the `royce` character id and exposing the native Royce message box.

## Validation
- Automated tests and JavaScript syntax checks must pass before Windows GUI validation.
- Windows GUI validation remains required for the final packaged EXE, including character selection, Royce appearance, movement, facing, drag, click reactions, `royce` Easter egg, and existing Dog/Growlithe behavior.


# v0.1.12 — Spheal stabilization patch

## Changed
- Spheal mouse hit testing now uses the actual character DOM bounds reported by the renderer instead of the previous fixed 110×110 window rectangle.
- Rebuilt the Spheal clap and Water Gun playback resources as clean one-shot frame sequences using the approved existing visual forms, removing neighboring-frame artifacts from the original crops.
- Spheal startup/base image now uses the cleaned idle presentation.
- Water Gun and clap remain one-shot actions and return to the normal state after the sequence.

## Impact / regression review
- Pet Engine state selection and existing character modules were not changed.
- Spheal ROLL assets and playback logic were not changed.
- Growlithe, Neukgu, and Royce behavior remains on the shared renderer/input path.

## Validation
- Automated test suite: 49/49 passed.
- JavaScript syntax checks: passed.
- Windows Electron visual validation of the new hitbox and animation presentation remains required.

# v0.1.12 — Spheal patch 09

## Changed
- Restored the original `spheal-base.png` artwork as the runtime and startup base image; the alternate idle artwork is no longer used as the default presentation.
- Preserved the original base artwork RGB pixels while normalizing all non-transparent pixels to opaque alpha, preventing the same white body spots/highlights from changing appearance against different backgrounds.
- Rebuilt REACT and Water Gun PNG frames from the supplied sheets by isolating the intended Spheal/effect pixels and removing neighboring-frame/source-sheet artifacts.
- Removed stray source-sheet text/artifacts from Water Gun frames.
- Slowed special-action playback to 140 ms/frame for clap and 160 ms/frame for Water Gun.

## Impact / regression review
- ROLL assets and playback logic were not changed.
- Pet Engine, shared input handling, IPC, window movement, and existing character modules were not changed.
- Spheal remains a character-module-only feature; no character-specific logic was added to Pet Engine.

## Verification
- Automated test suite: 52/52 passed.
- JavaScript syntax checks: passed.
- Static asset inspection: base RGB unchanged from patch 08; non-transparent base pixels are now fully opaque; REACT/Water Gun frames contain the intended isolated frame content without the previous neighboring full-character artifacts.
- Actual Electron/Windows visual verification remains required.


## Spheal Patch 10
- Replaced the previous Spheal clap and Water Gun frame sets with newly constructed fixed-position animations.
- Kept the original Spheal base artwork and corrected only obvious stray saturated pixels plus transparent eye pixels.
- Special action timing changed to 180 ms/frame for clap and 200 ms/frame for Water Gun.
- Roll and shared input architecture were intentionally left unchanged.
- Verification: 52/52 tests passed; JavaScript syntax check passed; image-level artifact/eye checks passed.
- Manual Electron/Windows visual verification remains required.

## Patch 13 — Spheal base-eye alpha fix

- Restored `spheal-base.png` to the known-good source used by patch07.
- Preserved RGB values exactly.
- Fixed only non-transparent pixels inside the two eye regions by normalizing their alpha to 255.
- ROLL frames, common input handling, renderer logic, and other characters were not changed.
- Runtime visual verification remains required.

## Spheal Patch 21 — clap anatomy and watergun mouth alignment

- Rebuilt clap sprites as two attached flippers over a clean rounded body, removing residual limb silhouettes and rectangular belly overwrites.
- Repositioned the firing mouth within the original snout on Water Gun frames 04-08; retained a single contiguous stream and unchanged shake frames 09-11.
- Removed stale duplicate CSS water-recoil keyframe fragments.
- No Pet Engine/ROLL/common input or persistence changes.
- Automated tests and real Electron visual verification are reported separately in PATCH-21-README.txt.

## Spheal Patch 22 — partial flipper shadow and flowing single water column

- Recolored pixels only within existing clap flipper fills (8 frames), increasing differentiation without duplicating hands or changing silhouettes.
- Animated the Water Gun beam in frames 04–08 with short 2–3-tone accents, changing length and subtly jagged contour; left the mouth and shake frames untouched.
- Kept ROLL, shared state/input, base/idle, character scale and all other character assets unchanged.
- Requires Windows Electron visual confirmation despite automated test results.

## Spheal Patch 23 — localized CLAP fin creases and tapered WATER GUN

- Baseline: Patch 22 `661e7c5a87280056f4487cf209bdc9ee9adbf15e`; preserved Patch 21 `fcadadbffb9e8fda35f3fcd1b619a401d5d6d729` as the clean CLAP artwork reference.
- CLAP 01–08: removed Patch 22's broad horizontal belly/flipper shadow by restoring the corresponding Patch 21 pixel base. In CLAP 03–06, added eight localized cream-tone pixels per frame (four pixels per flipper) as short diagonally staggered fold shadows. No extra limbs, black outlines, sprite geometry or timing changes.
- WATER GUN 04–08: reshaped the outer beam caps into stepped/tapered endpoints, moved short highlight/shadow dashes between firing frames and fixed frame 06's fully cropped rectangular leading edge. Only x<=32,y=36–48 in the firing PNGs were eligible for modification; mouth, head and body x>=33 were preserved.
- WATER GUN 01–03 and 09–12, shake/droplets, ROLL, base/idle, JS/CSS, shared input and other characters were not edited.
- Added bright/dark frame contact sheets and a Patch 22→23 visual comparison guide in `docs/spheal-patch23/`.
- Verified via PNG decode/re-encode roundtrips, constrained changed-pixel masks, firing beam per-column continuity, and rendered contact sheets. **Node test suite and Windows Electron / EXE visual tests were not executed in this environment and remain mandatory manual follow-up.**
