# Screen bounds and canine concept review

Baseline: `6c97ae76e48745bd4a21a02739e439da4e8a0eec`. Work is isolated on
`feat/screen-bounds-character-concepts`; existing PRs/main are not updated.

## Phase 1 contract

Main remains authoritative for native position in Electron DIP coordinates.
Character-specific, facing-independent body envelopes include existing motion
extents, not the whole transparent window or distant special-effect particles.
Drag may cross attached monitors; normal autonomous targets stay on the current
monitor as before. Work-area/topology changes immediately reconcile the pet,
including idle/sleep/frozen states, and resynchronize Renderer position/targets.
No animation/state reset, resource changes, or extra display-scale multiplication.

Reproduce removal/shrinking of a monitor while idle and stale Renderer targets;
test all four envelopes, negative coordinates, mixed scale metadata, tiny work
areas, cross-monitor drag, initial placement and native position corrections.
Then run existing syntax/Node/Spheal checks. Native Windows monitor/DPI behavior
is a separate NOT VERIFIED gate. Phase 1 gets its own reversible commit.

## Phase 2/3 contract

Keep runtime dog SVGs and animations byte-identical. Place reviewed SVG concepts,
white/dark comparisons and IDLE/WALK previews in a separate concept directory.
Retain Neukgu's pale block-wolf identity and Royce's black/tan identity, with
different proportions/anatomy rather than a palette swap. No 3D engine or new
dependencies. Record pivots, contact constraints and six-state transition plans
for a later, explicitly approved runtime implementation. Commit separately.

## Phase 1 findings and verification

- Reproduced against the exact baseline Main in a mocked Electron screen: an
  idle pet at x=-1600 remains entirely outside the surviving primary after
  display removal; (1800,900) remains outside a 1280×720 replacement work area.
  This confirms missing topology reconciliation, not merely the old visual box,
  as a complete-disappearance path. The shared Neukgu box also underestimates
  other bodies, and stale Renderer targets are not notified of native clamping.
- New `window-bounds.js` keeps facing-independent body/motion envelopes. Effects
  such as beam tips and speech bubbles do not inflate the body movement boundary.
  Main selects the nearest attached display by requested body center, clamps in
  DIP and reconciles after display add/remove/metrics changes. An active drag's
  anchor is rebased after a topology correction, allowing it to continue.
- `pet:window-updated` conveys native position/current bounds. Renderer retargets
  or clamps its target without resetting state/one-shot timers. Revisions reject
  late getWindow replies. Equal tiny-area limits do not produce out-of-range
  random targets. Existing Pet Engine/character modules/resources are unchanged.
- PASS: syntax, Node 65/65 including baseline reproduction, all four profiles,
  negative origins, work-area corners/gaps, metadata scales 1/1.25/1.5/2,
  tiny areas, initial/native correction, cross-monitor drag and stale replies.
  Linux Electron: all four character visibility, 47 PNG decode, ROLL and all
  three special one-shots, freeze/cleanup/input and bounds checks pass.
- Additional PNG suite: 11/12 pass, 1 pre-existing test defect in
  `test_effects_outside_source_body_and_all_clap_frames_remain_exact`:
  WATER GUN 09–11 are excluded from the counter but the counter must be >0.
  Both that file and all Spheal/Growlithe resources are byte-identical to baseline.
  This defect is recorded without changing assets or weakening assertions.
- Windows Electron/EXE, physical hotplug, taskbar relocation and mixed-DPI window
  behavior: **NOT VERIFIED**. Run the native checklist after user review.

## Phase 2/3 delivery

`design/character-concepts/` contains separate current/concept SVGs, a white/dark
comparison, four normalized motion phases, a phase sheet/APNG and a standalone
HTML preview with real IDLE/WALK clocks. XML validity, unique IDs and Electron
loading/rendering (8 images, 4 inline SVGs, 22 animations) pass. Visual review of
the rendered comparisons/phase sheet covers silhouette, contrast and limb joins;
this is concept review, not acceptance of runtime animation or Windows rendering.
Runtime canine SVGs/controllers and all Spheal/Growlithe assets remain unchanged.

`ANIMATION-PLAN.md` in that directory defines six states, anatomy pivots, contact
constraints, cancellation and later bounds measurement. Preview leg tracks are
studies; joint-level contact solving and actual-size approval remain future work.

## Windows manual checklist (NOT VERIFIED)

- All four characters: initial placement, idle/move/facing, click, drag across
  each edge and monitor seam, release and right-click exit; preserve bubbles.
- Mixed 100/125/150/200% DPI, negative monitor origins, vertical arrangements,
  monitor unplug/reconnect, resolution and taskbar/work-area changes while idle,
  walking, dragging and during Spheal frozen/one-shot states.
- Confirm native correction immediately updates movement targets; no jumps back
  to removed displays, trapped drag, fully invisible body or oscillation at edges.
- Preserve Spheal special inputs/timings/cleanup and Growlithe motions/inputs.
- Review separate canine concepts on white/dark and at future runtime size;
  approve proportions before replacing any runtime model or animations.
