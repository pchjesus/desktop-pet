# Jiwoo IDLE v0.2 — Fully opaque blink correction (UNAPPROVED)

Date: 2026-11-03 KST  
Purpose: correct the "visible eyes after blinking" defect reported in earlier Jiwoo IDLE prototype, without altering approved art.

## Canonical input — user-supplied, not a re-render

- **Directly used** newest explicitly re-supplied full three-character image `1000040935.png`.
- Source dimensions: **1536 × 865, RGB** with **black background**; this is different from the earlier 1672×941 RGBA master. Do not silently substitute one for the other.
- Source SHA-256: `3c1626ac3fcc3e78c289f96ff6106b84f235ae2c47f9c1aaa9d5193e04c30d3f`.
- Jiwoo v1 remains the approved appearance. The rejected Jiwoo hairline v1.1 is not used.

## Pixel processing

- For a **closed-eye test frame**, the original iris, sclera, pupils and highlights were replaced **opaquely** with constructed skin-tone pixels, followed by closed-lid curves; these pixels were not translucent-overlaid.
- Input/source is RGB and contains **no alpha channel**. The previous "alpha leak" description is better understood as incomplete underlying eye replacement in the prior frame.
- Static source and eye-open frames were not edited.
- The only changed pixels between original and closed-eye PNG: **12,724**, bounded entirely by **x=169..390 and y=252..341 inclusive**.
- Pixel changes **right of x=500: 0**, so Sullyoon and Seeun are unchanged.
- Pixel changes **at and below y=355: 0**, so all clothing, legs, and rest of body remain unchanged.
- Iris centers (238,302), (337,291) changed from dark iris pixels to skin-tone pixels, confirming those centers were repainted rather than translucently covered.

## Motion preview

- Stationary desktop companion, no autonomous movement.
- 8-second animated loop, with two short complete blinks and no other movement.
- **Animated PNG (APNG)**: `jiwoo_idle_blink_fixed_v0_2_UNAPPROVED.png` (lossless).
- **Animated WebP**: `jiwoo_idle_blink_fixed_v0_2_UNAPPROVED.webp` (lossless).
- **GIF**: `jiwoo_idle_blink_fixed_v0_2_UNAPPROVED.gif` (palette-limited, colors necessarily approximate).
- Both APNG and WebP were decoded, all **5 frames** checked byte-for-byte at the RGB-pixel level against their corresponding exact source or closed-eye PNG; all **5/5 exact** for each lossless format. GIF frame and playback existence checked; its palette conversion does not preserve source exact RGB.
- Two still comparisons: `eyes_before_after_v03.png` and `jiwoo_lineup_original_vs_closed_v02.png`.

All image files, source script and hash manifest are stored in conversation backup `jiwoo_idle_blink_fixed_v0_2_UNAPPROVED_20261103.zip` (CRC verified). **No image binary is committed to GitHub**; this file is solely a review record.

## Status and safeguards

- **NOT APPROVED**: this is a new blink frame for visual review, not permission to replace prior approved still art.
- The skin reconstruction and eyelid shape are not a perfect replacement for professional layered illustration; visual inspection needed for whether they feel natural.
- No other idol was regenerated, no Electron or EXE integration was performed, and no ChatGPT event notification connection was made.
- Existing five non-idol pets and their autonomous movement remain intact.
- `main`, Electron runtime, shared input/state, and existing v1 approvals remain unmodified.
