#!/usr/bin/env python3
"""Build a self-contained Spheal sprite pack from the existing committed PNGs.

Run from any directory: python codex-spheal/build_pack.py
Pillow is optional and used only to make transparent contact-sheet PNGs.
The source assets are never modified.
"""
from __future__ import annotations

import io
import json
import struct
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "codex-spheal" / "manifest.json"
OUTPUT = ROOT / "dist" / "Spheal-Codex-Pack.zip"


def dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        header = stream.read(24)
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"Not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


def sheets_in_memory(manifest: dict, paths: dict[str, Path]) -> dict[str, bytes]:
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not installed: packaging original PNGs and HTML sprite gallery without sheet PNGs.")
        return {}
    groups = manifest["sprite"]
    group_names = ("idle", "roll", "clap", "watergun", "icebeam")
    result: dict[str, bytes] = {}

    def sheet(files: list[str], columns: int = 6) -> bytes:
        cell_w, cell_h = 136, 100
        rows = (len(files) + columns - 1) // columns
        canvas = Image.new("RGBA", (columns * cell_w, rows * cell_h), (0, 0, 0, 0))
        for i, file in enumerate(files):
            with Image.open(paths[file]) as original:
                sprite = original.convert("RGBA")
            # Preserve exact source pixel values and native 80x80 / 120x80 dimensions.
            x = (i % columns) * cell_w + (cell_w - sprite.width) // 2
            y = (i // columns) * cell_h + cell_h - sprite.height - 10
            canvas.alpha_composite(sprite, (x, y))
        out = io.BytesIO()
        canvas.save(out, format="PNG", optimize=True)
        return out.getvalue()

    for name in group_names:
        result[f"codex-spheal/sheets/{name}-sheet.png"] = sheet(groups[name]["frames"])
    all_frames = [file for name in group_names for file in groups[name]["frames"]]
    result["codex-spheal/sheets/all-poses-sheet.png"] = sheet(all_frames)
    return result


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files: dict[str, Path] = {}
    for key, group in manifest["sprite"].items():
        for relative in group["frames"]:
            if relative.startswith("/") or ".." in Path(relative).parts:
                raise ValueError(f"Unsafe asset path: {relative}")
            path = ROOT / relative
            if not path.is_file():
                raise FileNotFoundError(f"Missing {key} frame: {relative}")
            expected = (120, 80) if key in ("watergun", "icebeam") else (80, 80)
            # Portrait can have a different native size.
            if key != "portrait" and dimensions(path) != expected:
                raise ValueError(f"Frame size mismatch: {relative}: {dimensions(path)} != {expected}")
            files[relative] = path
    result_sheets = sheets_in_memory(manifest, files)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=8) as archive:
        for relative in sorted(files):
            archive.write(files[relative], relative)
        for relative in ("codex-spheal/manifest.json", "codex-spheal/preview.html",
                         "codex-spheal/README.md"):
            archive.write(ROOT / relative, relative)
        for relative, png in sorted(result_sheets.items()):
            archive.writestr(relative, png)
    with zipfile.ZipFile(OUTPUT) as archive:
        if archive.testzip():
            raise RuntimeError("ZIP integrity check failed")
    print(f"Pack: {OUTPUT}")
    print(f"Original PNG files: {len(files)}, generated sprite sheet PNGs: {len(result_sheets)}")
    print("Review locally: extract ZIP, then open codex-spheal/preview.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
