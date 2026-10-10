# Spheal Patch 22 → Patch 23 visual comparison

**How to read**: the left is the preserved Patch 22 commit; the right is Patch 23. These linked image pairs display the same original PNG frame (no resizing algorithm or overlay). The attached contact sheets show all edited poses with the light background above and the dark background below.

## Clap peak (frame 04)

| Patch 22: long warm crease | Patch 23: two short diagonal side creases |
|---|---|
| ![Patch22 clap04](https://github.com/pchjesus/desktop-pet/blob/661e7c5a87280056f4487cf209bdc9ee9adbf15e/src/assets/characters/spheal/animations/clap/clap-04.png?raw=true) | ![Patch23 clap04](../../src/assets/characters/spheal/animations/clap/clap-04.png) |

The broad Patch 22 shading is removed in all eight frames. Only 03–06 receive small new fold pixels. Frame 04 and 05 are identical in each version to hold the clap pose.

## Water Gun maximum extension (frame 06)

| Patch 22: flat/cropped tip | Patch 23: staggered/tapered tip |
|---|---|
| ![Patch22 watergun06](https://github.com/pchjesus/desktop-pet/blob/661e7c5a87280056f4487cf209bdc9ee9adbf15e/src/assets/characters/spheal/animations/watergun/watergun-06.png?raw=true) | ![Patch23 watergun06](../../src/assets/characters/spheal/animations/watergun/watergun-06.png) |

The open mouth and head pixels are identical. Water from 04–08 remains a single thick connected column. The x=0 truncated cut of 06 is removed.

## Frame sheets

![Patch23 clap eight frames white and dark backgrounds](./clap-contact-sheet.png)

Clap columns: 01, 02, 03, 04, 05, 06, 07, 08. Upper row: light; lower row: dark.

![Patch23 Water Gun five firing frames white and dark backgrounds](./watergun-contact-sheet.png)

Water Gun columns: 04, 05, 06, 07, 08. Upper row: light; lower row: dark.

**Scope**: source PNGs are pixel-level full-body frames. Screenshots/sheets do not establish Windows Electron animation quality. Actual Electron manual verification is still required.
