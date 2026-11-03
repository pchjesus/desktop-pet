# Approved SD Idol Three-Lineup Archive — manifest

Date: 2026-11-03 (KST)

## Approval status

- Hearts2Hearts Jiwoo: approved **v1**; v1.1 hairline candidate is **REJECTED / NOT ADOPTED**.
- NMIXX Sullyoon: approved **v1**; immutable.
- STAYC Seeun: approved **v1**; immutable.

## Archive identity

A separate **conversation-downloadable** ZIP was created:

`desktop_pet_three_sd_approved_reference_backup_20261103.zip`

**Important:** ZIP/PNG bytes are not stored in this GitHub branch. This document records their identity and verification only. Do not interpret file names below as actual GitHub paths.

Canonical master is an unchanged copy of the user-supplied, approved **1672 × 941 RGBA** lineup after the Jiwoo v1 face change:

- `master/approved_lineup_3_v1.png` — SHA-256 `87e7413dc9e8911df09a54941cff2bcc691a88dfc91d881559ceb794efb92ec6`
- Earlier, pre-face-change lineup — SHA-256 `f4d314aeef04f46076f4859cba7d6fb7b624f60912cf51272aadf0c8fd264988`

### Crop-only derivatives

Each PNG below was obtained by simple rectangular cropping from the canonical master. It contains no regenerated or retouched pixels.

| PNG in backup ZIP | Rect (left, top, right, bottom) | SHA-256 |
| --- | --- | --- |
| `characters/jiwoo_approved_v1.png` | (70, 70, 525, 865) | `c51e84173cc276f0aa89d77c4a6d74877a0fd1954d79f48624f0dcbdb64bb094` |
| `characters/sullyoon_approved_v1_crop.png` | (555, 60, 1100, 865) | `0e6e7266d4b268eedceab7aacef8fb027ec3dea4f35f6261ea263ac4f49e5782` |
| `characters/seeun_approved_v1_crop.png` | (1110, 60, 1620, 865) | `6bf7f95042be9f3de33fbc74134c901799a317e726dc52c8c41c06f8c3e3b7c0` |

### Verification

- All derivative crop RGBA pixel values are identical to the corresponding source pixels.
- Jiwoo v1 versus user-supplied pre-revision lineup: **35,352** changed pixels, bounding box x=212..438, y=221..429 (inclusive).
- Every pixel of Sullyoon/Seeun is unchanged.
- Alpha channel is identical between before/after master images.
- ZIP passed file-integrity verification.
- Existing historical `v1/README.md` references a **different 2172 × 724 RGB master**. Do not mix its hashes with this 1672 × 941 RGBA archive.

## Boundaries

Reference assets only. No Electron source/runtime sprites, animation states, UI behavior, or executable have been changed or tested. Existing edge-fringe artifacts may require future validation before alpha compositing or animation. Preserve all approved imagery and obtain explicit approval for visual changes.
