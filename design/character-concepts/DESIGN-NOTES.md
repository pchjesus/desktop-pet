# Neukgu / Royce concept review

Review only; no runtime replacement. Current SVGs were copied from
`src/index.html` at `6c97ae7` (only the XML namespace was added for standalone
loading). New SVGs are authored from that existing polygon/block anatomy;
there is no external character asset or generated raster replacement.

| Area | Neukgu | Royce |
|---|---|---|
| Identity | Pale angular wolf, alert/light | Black/tan companion, grounded/solid |
| Proportion | Narrower torso, longer forelegs, taller upright ears | Barrel chest, broader head, shorter stronger legs, folded tips |
| Face | Tapered cheek planes, separate muzzle/chin, cool nose and eye highlights | Tan eyebrows/cheeks, broader muzzle, warm irises, softer mouth corner |
| Connection | Overlapping neck planes join shoulder/head, bushy tail grows from hip | Shorter neck flows into broad chest patch, lower substantial tail |
| Depth | Cool gray far legs, near white planes, limited silver shadows | Slate back planes, shaded far legs, amber near paws and edge contrast |
| Motion preview | 900ms four-beat walk; 2.4s subtle breathing | 1100ms four-beat walk; 2.8s restrained breathing |

`preview.html` runs the IDLE/WALK examples with no dependencies or network.
The comparison normalizes both designs to the same display box; actual-size
compatibility is still a future implementation task. `motion-0..3.png` sample
cycle phases 0/25/50/75%. Preview paw tracks keep vertical contact through 60%
(Neukgu) / 64% (Royce) of their cycle, lifting during recovery only. The torso
loads independently of the paws; the head counters the loading. Far/near limbs
have quarter-cycle offsets. These are motion studies, not final joint IK.

`motion-sheet.png` stacks the four sampled phases. `motion-phases.png` is an
animated PNG cycling those normalized samples once per second; use `preview.html`
for the actual, different IDLE/WALK durations. Electron loaded all eight static
SVG images and four inline previews (22 animations); all four SVG files parse
with unique internal IDs. `render-check.json` records that rendering check.

Review concerns: preserve readable eyes at the future 78×72 runtime size;
avoid shoulder/hip seams at swing extremes; check Royce's dark coat on actual
desktop backgrounds; approve ear shape, muzzle and body proportions before
replacing either runtime model. Future bounds must be measured after scaling,
both facing directions and all poses. Existing hit testing, messages, drag,
Easter eggs and movement remain untouched by these concept files.
