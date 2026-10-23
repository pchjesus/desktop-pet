# Soft canine runtime implementation (preview)

Baseline: approved round concepts at `0a3357f`. Work is isolated on `feat/canine-soft-runtime`.

- Applied separate approved SVG models to Neukgu/Royce only, preserving the character class contract `setState / setFacing / render` and OS window movement/input.
- Head proportions gently enlarged (~6–7%) inside the original 78×72 viewport; curved line art uses geometric-precision rendering. Start screen previews now match runtime art.
- The pet's six shared states select scoped SVG poses. IDLE breathes/blinks, WALK uses short steps, SIT lowers haunches/body with grounded front paws, SLEEP rests with closed eyes, REACT gives a brief head response, DRAG tucks dangling legs. Transitions are short, cancellable CSS animations; no new timers or state machine.
- Native directions still flip the outer character only. Browser CSS animates inner SVG groups so facing transform is not replaced. Special inputs, messages, other characters, start/manual windows and packaging config are preserved.
- Existing bounds envelopes intentionally remain conservative: the new canine body sits within their 180×150 DIP footprint. Verify all six states and left/right orientations on Windows before tightening any per-character bounds.
- Fixed two regression-suite defects independently: retired the required historical Git checkout for the bounds test while keeping the direct four-character behavior assertions; restored the approved Water Gun 09–11 droplet exemption's effect-count condition to frames 04–08, with existing dedicated frame footprint tests intact.
- Real Windows animation appearance, click-through/drag, screen edges, 100–200% DPI and monitor hotplug require manual EXE validation; automation passing is not user visual acceptance.
- Rollback: revert canine runtime commit while retaining earlier bounds and concept commits. Do not merge into main until Windows/user approval.
