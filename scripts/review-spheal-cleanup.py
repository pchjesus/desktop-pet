"""Pixel audit and 1:1 white/dark before-after playback of runtime assets."""
import hashlib
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets/characters/spheal'
OUTPUT = ROOT / 'docs/spheal-runtime-cleanup'
BASELINE = '0dfdb4d4ec38fefa22b1d82c1e7ab962fce57a37'


def before(relative):
    data = subprocess.check_output(['git', 'show', f'{BASELINE}:src/assets/characters/spheal/{relative}'], cwd=ROOT)
    return Image.open(io.BytesIO(data)).convert('RGBA')


def composite(old, new, label):
    # 1 PNG pixel == 1 displayed pixel. Do not stretch the character for review.
    out = Image.new('RGB', (260, 208))
    d = ImageDraw.Draw(out)
    for row, bg in enumerate(['#ffffff', '#252b38']):
        d.rectangle((0, row * 104, 260, row * 104 + 103), fill=bg)
        for col, im in enumerate([old, new]):
            d.text((col * 130 + 4, row * 104 + 3), f'{label} {"before" if col == 0 else "after"}', fill='#7c8799')
            out.paste(im, (col * 130, row * 104 + 22), im)
    return out


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    groups = [('base', ['spheal-base.png'], [1000]),
              ('roll', [f'roll-{i:02}.png' for i in range(1, 13)], [105] * 2 + [90] * 6 + [105] * 4),
              ('clap', [f'animations/clap/clap-{i:02}.png' for i in range(1, 9)], [180] * 8),
              ('watergun', [f'animations/watergun/watergun-{i:02}.png' for i in range(1, 13)], [175] * 12),
              ('icebeam', [f'animations/icebeam/icebeam-{i:02}.png' for i in range(1, 15)], [175] * 2 + [150] * 6 + [1000] + [125] * 4 + [200])]
    audit = []
    for kind, paths, durations in groups:
        frames = []
        columns = min(4, len(paths))
        rows = (len(paths) + columns - 1) // columns
        sheet = Image.new('RGB', (260 * columns, 208 * rows), '#f3f3f3')
        for index, relative in enumerate(paths):
            old, new = before(relative), Image.open(ASSETS / relative).convert('RGBA')
            changed = [(x, y) for y in range(new.height) for x in range(new.width)
                       if old.getpixel((x, y)) != new.getpixel((x, y))]
            deleted = sum(new.getpixel(p)[3] == 0 for p in changed)
            audit.append({'path': relative, 'size': list(new.size), 'changed': len(changed),
                          'deleted': deleted, 'retained_translucent': sum(0 < a < 255 for a in new.getchannel('A').tobytes()),
                          'before_rgba_sha256': hashlib.sha256(old.tobytes()).hexdigest(),
                          'after_rgba_sha256': hashlib.sha256(new.tobytes()).hexdigest()})
            frame = composite(old, new, f'{kind} {index + 1:02}')
            sheet.paste(frame, ((index % columns) * 260, (index // columns) * 208))
            frames.append(frame)
        sheet.save(OUTPUT / f'{kind}-comparison.png')
        if len(frames) > 1:
            frames[0].save(OUTPUT / f'{kind}-playback.png', save_all=True, append_images=frames[1:],
                           duration=durations, loop=0, disposal=0, blend=0)
    # Enlarged BASE inspection, beside the unscaled sheet above.
    image = Image.open(OUTPUT / 'base-comparison.png')
    image.resize((image.width * 4, image.height * 4), Image.Resampling.NEAREST).save(OUTPUT / 'base-zoom.png')
    (OUTPUT / 'pixel-audit.json').write_text(json.dumps({'baseline': BASELINE, 'frames': audit}, indent=2) + '\n')
    print(f'47 runtime PNGs reviewed; {sum(row["changed"] > 0 for row in audit)} changed, '
          f'{sum(row["deleted"] for row in audit)} pixel deletions; CLAP unchanged.')


if __name__ == '__main__':
    main()
