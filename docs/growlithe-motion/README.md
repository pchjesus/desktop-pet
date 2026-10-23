# Growlithe source-pixel motions

Baseline: `9dde4ea`. Goal: articulate the existing HG/SS Growlithe through six shared states and add a contained, one-shot Flamethrower. Character pixels remain derived from the verified original; no engine, IPC, window sizing, native WALK or REACT APNG timing changes belong to this component.

## Resource provenance and regeneration

`src/assets/characters/growlithe-hgss.png` remains byte-identical to the selected 80 × 80 source (SHA-256 `ed58999248f69a686aed6048a57900a751ec8a8b9df9c161ecabfa592d135c96`).

Run `python scripts/generate-growlithe-motion.py` with Pillow available to reproduce PNGs, metadata and review images. Pillow is a generation tool only; the application and Node tests gain no dependencies. The generator copies source regions, translates limbs/ruff by integer pixels, lays the striped haunch horizontally, and closes the eyes with the original palette. Every resize used for review is nearest-neighbor. Runtime PNGs retain native pixel scale.

| State | Motion |
| --- | --- |
| IDLE | Original source alternating with a one-pixel ruff breath every 700 ms; brief independent ear/tail twitches at 2100/2240 ms of a 5600 ms cycle, paws planted |
| WALK | Existing native walking APNG, unchanged: six 120 ms frames, independently changing feet in source band y=56–65 |
| SIT | Lowered haunch/folded rear paw, two ruff frames at 800 ms |
| SLEEP | Curled side body, tail over the back, lowered closed-eye head over forepaws; local breath every 1100 ms |
| DRAG | Independent alternating extended paws every 240 ms |
| REACT | Existing native reaction APNG, reloaded per reaction; native timing unchanged |

SLEEP → IDLE unfolds over 360 ms: half-open eyes, head lift at 120 ms while the rump stays curled, body rise at 240 ms onto planted paws, and full standing at 360 ms. Other transitions immediately select their own pose. The visual references arrived during integration. The pose follows the curled side-lying reference description: lowered head, closed eye, cream mane beside the cheek, folded paws, striped side body and cream tail at the rump. Subjective visual acceptance remains pending.

## Flamethrower and containment

`startSpecialAction('flamethrower')` begins one 2900 ms action. `isSpecialActionActive()` reports the visual priority hold. Repeated triggers and ordinary state/direction updates are ignored during the action. DRAG cancels immediately and restores ordinary image geometry. Completion clears the special class and restores IDLE. A later trigger can replay the action.

29 full-frame PNGs run at 100 ms each: brace/preparation → open mouth → ignition → connected sustained flame → narrowing tail-off → closed-mouth recovery. The pixel flame starts at canvas mouth coordinate (64, 70), has an off-white/yellow core, orange interior, red edge, four flicker variations and small detached embers. The primary stream remains contiguous to the mouth during every ignition/burn/taper frame.

All special frames are 170 × 150 and contain the source 80 × 80 canvas at (45, 31). The special canvas displays at window x=10..180, centered on the existing character facing pivot x=95 in the 180 × 150 window. The body stays aligned with the ordinary sprite. Flip the entire character for the opposite facing. Every asset has a transparent border, so the source art and all particles remain inside the existing window; no larger BrowserWindow is required. CSS must reset animation/transform for the special image and set the full-frame image origin to the ordinary sprite origin minus (45, 31).

## Review evidence

- [Light/dark sleep before/after](sleep-before-after.png)
- [Wake progression: head first, then body](wake-progression.png)
- [Flamethrower playback, 3× nearest-neighbor](flamethrower.gif)
- [Interactive actual-module preview](preview.html): six states, one-shot playback, facing and light/dark background; display is exactly 180 × 150.

The preview can open from the filesystem or any static server rooted at the repository. It exercises the actual character module and production PNGs. The GIF loops for review; the application action plays once per trigger.

## Verification and remaining acceptance

`node --test test/growlithe-character.test.js test/growlithe-motion.test.js` passes 16 tests. Tests cover the immutable original SHA, native APNG resources, priority/repeat/direction behavior, finite renderer clock handling, cleanup/completion/replay, wake timing, frame dimensions and alpha bounds, source-palette sleep pixels, connected flame/core/flicker/taper.

Manual Windows overlay and subjective animation acceptance remain part of parent integration verification. These artifacts do not claim packaged EXE validation or final visual approval. Rollback consists of restoring `src/characters/growlithe.js`, its focused tests, and removing the new Growlithe motion assets/generator/review directory; original assets remain intact.
