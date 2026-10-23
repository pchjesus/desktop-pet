# Pachirisu Follow Me

Source: selected Pachirisu files from the user-uploaded personal ZIP, integrated
on `9dde4ea`. Existing official-source GIF, six ordinary state mappings, movement
speed and click/electric CSS timings are preserved. See `../INTEGRATION-REVIEW.md`
for provenance and copyright limitations; no license/ownership claim is made.

The user subsequently supplied the white/cyan pointing-hand illustration,
side-lying Growlithe and continuous flame references. The Follow Me hand is a
separate locally authored SVG inspired by the supplied icon, not a crop of the
illustration or an embedded background.

## Timeline (existing 4400ms duration retained)

- 0ms: white/teal pointing finger above the head, brace pose.
- 450–3500ms: three rear meteor lanes at different scales/phases. Bright cores,
  flame tails, trailing sparks and small landing fragments stay behind the body.
- 700–1000ms: forepaw reaches from the chest, berry rises toward the mouth.
- 1500 / 2200 / 2900ms: partial / mostly eaten / vanished berry. Four 18×18
  canvases have successively cut-out silhouettes; remaining pixels retain the
  same positions/colors. Chewing repeats without shrinking the fruit.
- 3500–4100ms: recovery glints, then the clean original pose and IDLE at 4400ms.

The ordinary sprite CSS is replaced only during Follow Me by native 180×150 PNGs
aligned to the same body anchor. The separate finger remains visible while
meteors start and hides before recovery. The text bubble is hidden on start to
avoid covering that icon. No new window is created. Facing remains locked during
playback. Repeated commands/ordinary state requests cannot replace the frames.
A simple click preserves the active special; moving beyond the existing 6px drag
threshold cancels it. Completion/cancellation hide the icon and restore ordinary
sprite geometry, original GIF and valid state.

## Evidence and regeneration

- `followme-sheet.png`: light/dark source-frame and fixed-size bite comparison.
- `followme-playback.png`: 44-frame transparent APNG (body/berry/rear effects;
  the dedicated SVG hand is added separately in the actual runtime).
- `pachirisu-*.png`: actual Linux headless Electron samples, including the hand.
- `five-character-launcher.png`: launcher layout/selection evidence with a test
  bridge; native Windows launcher/Manual window remains a separate check.
- `electron-check.json`: five-character integration result and platform limits.

Regenerate PNGs with `python scripts/generate-pachirisu-followme.py` (Pillow).
Run `node scripts/verify-character-integration.mjs` for real module/image loading,
input/priority/drag/facing/containment and cleanup checks in Linux headless Electron.
The real 180×150 display and both facings are checked; this is not physical-monitor
or Windows visual approval. Windows DPI/hit testing and subjective quality remain
**NOT VERIFIED** until actual device review.
