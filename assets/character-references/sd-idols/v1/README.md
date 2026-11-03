# SD Idol Character Visual Approvals — v1 (2026-11-03)

> Status: **reference design approval only**. Binary PNGs were prepared as a separate backup ZIP in the conversation, **not committed to GitHub**. Do not treat this document as a completed sprite integration.

## Approved designs (DO NOT REDRAW)

| Character | Design status | Appearance and costume |
|---|---|---|
| Sullyoon (NMIXX) | **APPROVED v1 — LOCKED** | Long half-up brown hair; pink S-A frill/corset stage dress; existing approved face/expression and clasped-hands pose |
| Seeun (STAYC) | **APPROVED v1 — LOCKED** | Brown 2026 `2:LOVE` bob with airy bangs and outward curling ends; white layered `2:LOVE` stage outfit; existing approved face/expression, hair ornament and cheek-touching pose |
| Jiwoo (Hearts2Hearts) | **NOT APPROVED** | J-B blue sporty top/white pleated skirt retained; face likeness requires revision from verified **Hearts2Hearts** Jiwoo reference photographs; do not confuse with NMIXX Jiwoo |

## Exact approved master

The 1st approved white-outfit Seeun + pink-dress Sullyoon group image was generated in this ChatGPT conversation as:

`a_clean_crisp_chibi_style_anime_illustration_on_a.png` (2172 × 724 RGB).

The following cropped references were made **without redrawing or changing the accepted faces**:

| Local backup filename | Crop bounding box (L,T,R,B) | SHA-256 |
|---|---|---|
| `approved_lineup_source_v1.png` | original 2172x724 | `810368e124966baeef4f60070de1b645ebf6ca198cd274b78c269126bf752d23` |
| `sullyoon_approved_v1.png` | (755,0,1230,724) | `27368e04ae09250cf48dc46afc131622b4d2d77986a840911e5f058e624f76fe` |
| `seeun_approved_v1.png` | (1320,0,1770,724) | `0373059cb9f6ebb292b999a8a6e047211383b3ecfbe3f170090ede2acb8592f3` |

When the images are added to the GitHub repository later, place unmodified copies under `assets/character-references/sd-idols/v1/` and verify the SHA-256 hashes. **Do not change the main app or overwrite its current runtime character assets.**

## Implementation status and safeguards

- These images have an RGB light/checkerboard background, **not real alpha transparency**.
- No animation frames / sprite sheets / idle, walk, sit, sleep or react states have been authored.
- There has been **no actual Electron or packaged Windows EXE verification** for these designs.
- Store as reference art first; produce runtime sprites later with deliberate background extraction and animation checks.
- Keep Sullyoon & Seeun physically cropped or copy-pasted, never AI-redrawn, when iterating only Jiwoo.
- No source, shared state, IPC, click, drag, movement, save, or packaging logic should change during reference-art archival.

## Next task

Revise **Jiwoo only**, with 10+ verified Hearts2Hearts Jiwoo photos spanning front, three-quarter, smile and side angles. Extract actual eye shape, brow, cheek outline, lip and 2025 GirlsAward bob silhouette. Do not accept a generic SD-face substitution.

