# Hearts2Hearts Jiwoo — SD Face Approval v1

**Approval date:** 2026-11-03  
**Decision:** USER-APPROVED v1 (first approved design, not final polish).  
**Base:** `assets/sd-idols-approved-v1`, commit `d9ca9d970bf1d0837649fb4eec5c35b6c34da3d3`.

## Locked visual reference

- Jiwoo: blue sporty top, white pleated skirt, sneakers/accessories, waving pose, and the established full-body SD proportions remain unchanged. Only the face and a small amount of adjacent bangs are altered.
- Sullyoon: approved and locked; do not regenerate, recolor, or alter.
- Seeun: approved and locked; do not regenerate, recolor, or alter.
- The **actual approved Jiwoo image** is the unmodified bytes of the conversation artifact `jiwoo_face_only_candidate_v3.png` (locally archived as `jiwoo_approved_v1.png`). Do not confuse it with any other named v4/v5 explorations.
- Approval is for static reference art only; no Electron/sprite integration is implied.

## Exact file identity and change isolation

| Artifact | Dimensions / format | SHA-256 |
| --- | --- | --- |
| `jiwoo_approved_v1.png` (conversation backup; originally `jiwoo_face_only_candidate_v3.png`) | 1672×941 RGBA | `87e7413dc9e8911df09a54941cff2bcc691a88dfc91d881559ceb794efb92ec6` |
| `lineup_before_jiwoo_face_revision.png` (user-supplied master; originally `1000040821.png`) | 1672×941 RGBA | `f4d314aeef04f46076f4859cba7d6fb7b624f60912cf51272aadf0c8fd264988` |

Verified with direct RGBA pixel comparison: exactly **35,352** changed pixels (2.247% of canvas), change bounding box **x=212..438, y=221..429** inclusive, and **zero changed pixels** outside the Jiwoo face region. The Sullyoon/Seeun regions are bitwise identical in the compared RGBA images.

The earlier `v1/README.md` describes a separate historical 2172×724 RGB approval source. Its hashes are **not** hashes of this newer 1672×941 user-provided RGBA master. Keep both records distinct.

## Storage/validation caveat

This is a **text-only GitHub approval record**. The actual PNG binary has **not** been committed to GitHub. A user-downloadable backup ZIP containing the exact two PNG files, a face comparison, and a checksum manifest was produced in the conversation. Do not infer that a repository-relative binary path exists until its bytes are uploaded and its checksum verified.

## Optional v1.1 improvement studies (UNAPPROVED)

1. Correct visible hairline/forehead blending and right fringe compositing artifacts within Jiwoo's face region. Prioritize this technical polish.
2. Compare eye angle, upper-lid thickness, and brow-to-eye spacing with verified Hearts2Hearts Jiwoo reference photographs; do not blindly enlarge eyes.
3. Refine cheek-to-chin contour and smile/lip line only if a visual side-by-side confirms recognizability improves.

All changes must be new **unapproved** candidate files; never overwrite `jiwoo_approved_v1.png`, and never rerender Sullyoon/Seeun or the whole lineup. Preserve existing costume, pose, scale, and alignment. Do not modify main, Electron source, sprite/animation system, or shared state.
