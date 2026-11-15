#!/usr/bin/env python3
"""Make the official v1 8x9 Codex/ChatGPT Pets sprite atlas from EXISTING Spheal PNGs.

No image generation; originals are read-only. Requires Pillow for pixel-preserving
nearest-neighbor composition. This is a layout adapter, not a new set of drawn poses.
"""
from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "src/assets/characters/spheal"
OUT = REPO / "dist"
CELL = (192, 208)
COLUMNS, ROWS = 8, 9
SCALE = 1.5


def frame(name: str, idx: int | None = None) -> Path:
    if idx is None:
        return SOURCE / name
    return SOURCE / f"{name}-{idx:02d}.png"


def action(folder: str, name: str, idx: int) -> Path:
    return SOURCE / "animations" / folder / f"{name}-{idx:02d}.png"


def build() -> None:
    base = frame("spheal-base.png")
    roll = lambda n: frame("roll", n)
    clap = lambda n: action("clap", "clap", n)
    water = lambda n: action("watergun", "watergun", n)
    ice = lambda n: action("icebeam", "icebeam", n)

    # Official row contract (0..8):
    # idle; move right; move left; wave; jump; failed; waiting; working; review.
    # Adopt the closest EXISTING approved poses. Completing a task is visually
    # represented by the review row's water-gun firing sequence, subject to the
    # host application's actual state-to-row mapping.
    rows = [
        [(base, False, 0), (base, False, -1), (base, False, -2),
         (base, False, -1), (base, False, 0), (base, False, 1)],
        [(roll(i), True, 0) for i in (3, 4, 5, 6, 7, 8, 3, 4)],
        [(roll(i), False, 0) for i in (3, 4, 5, 6, 7, 8, 3, 4)],
        [(clap(i), False, 0) for i in (1, 3, 5, 8)],
        [(clap(i), False, off) for i, off in ((1, 0), (3, -9), (4, -21), (5, -9), (8, 0))],
        [(ice(i), True, 0) for i in (1, 2, 4, 7, 9, 11, 13, 14)],
        [(clap(i), False, 0) for i in (1, 2, 3, 4, 3, 1)],
        [(water(i), True, 0) for i in (1, 2, 3, 2, 1, 1)],
        [(water(i), True, 0) for i in (1, 4, 6, 8, 10, 12)],
    ]

    canvas = Image.new("RGBA", (1536, 1872), (0, 0, 0, 0))
    assert [len(row) for row in rows] == [6, 8, 8, 4, 5, 8, 6, 6, 6]
    for y, row in enumerate(rows):
        for x, (source, flip, rise) in enumerate(row):
            if not source.is_file():
                raise FileNotFoundError(f"Missing source PNG: {source}")
            with Image.open(source) as original:
                sprite = original.convert("RGBA")
            native_size = sprite.size
            if native_size not in ((80, 80), (120, 80)):
                raise ValueError(f"Unexpected original frame dimensions: {source} {native_size}")
            scaled = sprite.resize((round(sprite.width * SCALE), round(sprite.height * SCALE)), Image.Resampling.NEAREST)
            if flip:
                scaled = scaled.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            px = x * CELL[0] + (CELL[0] - scaled.width) // 2
            py = y * CELL[1] + CELL[1] - scaled.height - 27 + rise
            if px < x * CELL[0] or py < y * CELL[1] or px + scaled.width > (x+1)*CELL[0] or py + scaled.height > (y+1)*CELL[1]:
                raise ValueError(f"Frame escaped its cell: row={y} col={x} {source}")
            canvas.alpha_composite(scaled, (px, py))

    # Image-level QA: transparency; used cells nonempty; unused cells empty.
    for y, row in enumerate(rows):
        for x in range(COLUMNS):
            rect = (x * 192, y * 208, (x + 1) * 192, (y + 1) * 208)
            alpha = canvas.crop(rect).getchannel("A")
            populated = alpha.getbbox() is not None
            if populated != (x < len(row)):
                raise ValueError(f"Bad atlas cell {y}/{x}: expected populated={x < len(row)}")
    assert canvas.size == (1536, 1872)

    OUT.mkdir(exist_ok=True)
    png = OUT / "spheal-codex-spritesheet.png"
    webp = OUT / "spheal-codex-spritesheet.webp"
    package = OUT / "Spheal-Codex-Native-Pet.zip"
    manifest = {
        "id": "spheal-codex",
        "displayName": "대굴레오",
        "description": "기존 80×80 도트 스프라이트를 활용한 작업 도우미 대굴레오",
        "spritesheetPath": "spritesheet.webp",
    }
    canvas.save(png, format="PNG", optimize=True)
    canvas.save(webp, format="WEBP", lossless=True, method=6)
    with Image.open(webp) as check:
        if check.size != (1536, 1872):
            raise ValueError("WebP roundtrip dimensions failed")
        if check.convert("RGBA").getchannel("A").getextrema()[0] != 0:
            raise ValueError("WebP lost transparency")
    with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("spheal-codex/pet.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        archive.write(webp, "spheal-codex/spritesheet.webp")
        archive.write(png, "spheal-codex/spritesheet.png")
    with zipfile.ZipFile(package) as archive:
        if archive.testzip() is not None:
            raise ValueError("ZIP CRC failed")
    print(f"Native v1 atlas: {png} / {webp}")
    print(f"Native package: {package}")
    print("Mapped rows: idle, right, left, waving, jumping, failed, waiting, running, review")
    print("The host application (not this atlas) decides which row signifies a completed task.")


if __name__ == "__main__":
    build()
