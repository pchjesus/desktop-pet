# Pachirisu / Growlithe integration

Baseline: remote `feat/canine-soft-runtime` at `9dde4ea210694972870d53ae3ddf6963fbe06f41`;
remote main at start: `8960f70fb409684bb69ad07a5e035282a963af52`.
Integration branch: `feat/pachirisu-growlithe-integration`.

## Scope and safety contract

Selectively import only Pachirisu's module/assets/registrations and tests from
`DesktopPet-Pachirisu-FollowMe-Personal.zip`; do not use the temporary extraction
branch, replace the repository, or import old unrelated code/documents. Retain
canine runtime, Spheal, bounds/DIP/topology reconciliation and existing inputs.
FollowMe: icon → rear meteors + repeated berry bites → recover → idle; drag cancels.
Growlithe: source-based ordinary poses and finite continuous Flamethrower with
mouth-connected fire, duplicate lock, drag cleanup. Keep the existing native
180×150 window if full-frame fire fits; distant effects do not enlarge body bounds.

Before main integration: syntax, all Node/shell, PNG checks, five-character
Electron integration, secret/unneeded artifact review and Windows packaging/smoke.
Keep feature commits reversible and existing Draft PRs #3/#4/history unchanged.
No force push, branch deletion, release publication or main reset.

## Source provenance / rights

The uploaded ZIP's local-only instructions describe its earlier distribution
status; the user's current request explicitly authorizes public integration.
That authorization is not proof of copyright ownership or a third-party license.
Pokémon characters/sprites belong to their respective rights holders; no ownership
or permission claim is made. Pachirisu B/W GIF and HG/SS sprites in the uploaded
ZIP are reported there as sourced via PokeAPI/sprites. The supplied Sitrus Berry
WebP is user-provided; its underlying ownership/license has not been established.
Original Growlithe HG/SS source and click APNG remain preserved. Derived poses
and effects are labeled as project edits, not additional official animations.
Follow Me references the 2014 championship Pachirisu moment; no endorsement claim.

After initial ZIP inspection the user supplied three visual references in chat:
white/teal pixel pointing hand, side-curled sleeping Growlithe and continuous
flamethrower (Charizard is reference only and is not included). Their backgrounds
are not used. A dedicated white/teal finger SVG is authored locally; source sprite
and berry edits remain separate from those reference illustrations.

## Integration results before Windows gate

- `npm run check`, `npm test` 88/88, `npm run test:shell` 15/15: PASS.
- Pillow: Spheal 12/12, Pachirisu 2/2: PASS. Growlithe frame size/alpha, source
  palette/anchor, connected flame, ear/tail and wake stages are in the Node suite.
- Linux Electron: five visible characters, six state paths, facing, click-armed
  case-insensitive FollowMe/Flamethrower, duplicate rejection, click preservation,
  real drag cancellation, finite cleanup and both-facing effect containment PASS.
  Separate existing Spheal checker confirms 47 PNGs, ROLL, all three one-shots and
  freeze/timing cleanup. No Spheal/canine sprites or Pet Engine edits from 9dde4ea.
- Launcher: five selections, decoded images, no overflow at 760×520, Start ID and
  Manual request bridge PASS. Native startup/Manual window check requires DISPLAY
  here; a diagnostic native-start headless adaptation exits SIGSEGV in this cloud.
  It is NOT VERIFIED by the layout bridge check or the default packaged smoke.
- Windows CI must build the portable and verify the renderer child readiness
  marker before main is advanced. The artifact/run records are authoritative for
  that tested SHA; physical Windows interaction/visual/DPI/multimonitor acceptance
  remains NOT VERIFIED even when packaging smoke succeeds.

No tests removed. The two four-character allowlist assertions were extended to
five; Growlithe's no-SVG/no-sheet assertions retain their intent but its CSS
`steps()` check is scoped to Growlithe rather than rejecting another character's
CSS animation name. All existing original Growlithe SHA/APNG assertions remain.

Main/window geometry changes from 9dde4ea are only Pachirisu registration and its
body envelope. New fire uses a 170×150 image centered on the existing Growlithe
facing pivot (screen x=95), at window x=10..180 in either direction. An initial
180px image would have flipped to x=10..190; actual Electron bounds tests caught
that before integration. Body anchor and the 180×150 native window are unchanged.

Native correction/topology tests iterate all five envelopes. No new IPC, focus,
effect windows, engine architecture, dependencies or persisted settings added.

Review found no secrets, ZIP uploads or build outputs staged. Source sprite/GIF/
berry bytes match the uploaded ZIP; existing Spheal/canine assets are unchanged.
Existing Draft PRs #3/#4 and temporary source extraction branch are not modified.

Rollback: keep `9dde4ea` and feature commits; revert integration commits in reverse
order on a new normal commit if needed. Do not reset main or force push. If all
new development must be undone, choose the previous main `8960f70` only as a
comparison point, never erase the preserved development history.


## Home/size/diagonal follow-up (baseline 958a2c89)

One branch, four scoped changes: 92×92 Growlithe ordinary/special body with fixed
anchor and connected mouth; app-lifetime IPC plus Home/Exit/Cancel and old-renderer
cleanup; screen-space diagonal meteors with regenerated facing variants/APNG;
current five-character manual. No new special, library or native window size.
The Growlithe profile grows with its body; the shared DIP/topology logic remains.

Local checks: syntax, Node 94/94 (including repeated five-pet Home loops, duplicate
handle rejection, cancel/exit/stale sender/timer cases), shell 15/15, PNG 15/15,
and headless five-character input/facing/size/containment regression PASS.
`size-comparison.png` and `meteor-direction-comparison.png` show the visual changes.
Windows CI runs `verify-home-electron.cjs` with actual BrowserWindows and renderer
IPC, scripted native-dialog responses, repeated selection and process exit. It
must pass alongside EXE build/smoke before main advances. This does not claim
manual native dialog clicking, physical monitor/DPI or visual approval.
Revert this follow-up's commits normally to restore 958a2c89; retain prior history.
