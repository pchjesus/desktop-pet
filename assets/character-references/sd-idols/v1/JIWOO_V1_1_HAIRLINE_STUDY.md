# Jiwoo SD v1.1 — Hairline cleanup study (UNAPPROVED)

Date: 2026-11-03 (KST)

**Do not replace the first approved Jiwoo v1.** This is an isolated static-reference experiment, not a release or Electron asset integration.

## Source of truth

- Approved Jiwoo v1 `jiwoo_approved_v1.png` in the conversation archive: SHA-256 `87e7413dc9e8911df09a54941cff2bcc691a88dfc91d881559ceb794efb92ec6`.
- v1.1 local candidate file `jiwoo_v1_1_hairline_candidate_UNAPPROVED.png`: SHA-256 `e04a51fe84a14f837a00e557733029a369855da35757ece9064847ee09d82e3c`.
- The files are shared in the conversation ZIP `jiwoo_v1_1_hairline_candidate_UNAPPROVED_20261103.zip`. **PNG binaries are not committed here.** No claim of GitHub PNG availability is made.

## Scope

Two localized hairline/forehead areas were edge-cleaned using non-generative, masked pixel processing. This reduces the diffuse left fringe and dark fuzzy right fringe, but the right-side strand may now appear slightly more geometric under magnification. The new appearance is **not** yet user-approved.

## Actual pixel verification

- Both images: 1672 × 941 RGBA.
- Exactly 5,788 changed pixels (0.368% of total).
- Changed region bounding coordinates: x=240..421, y=212..294.
- Alpha channel: identical at every pixel.
- y>=295: zero changed pixels (eyes/lower face/clothes/body preserved).
- x>=500: zero changed pixels (Sullyoon and Seeun completely unchanged).
- Approved original SHA-256 unchanged and retained in the backup archive.
- No shared code, Electron runtime, animation or sprites were changed.

## Follow-up

Show side-by-side full and cropped views to user. Continue with v1 as the canonical design until explicit approval. If the harder right-side edge is disliked, adjust only that fragment or revert to v1; do not rerender the entire lineup.
