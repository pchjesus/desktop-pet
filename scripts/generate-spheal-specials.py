"""Deterministic local pixel edits of preserved Patch 23 full-body sprites.

Development utility: Python + Pillow; never used by the app or npm install.
No smoothing, blur, resampled character art, or runtime effect overlays.
"""
import io
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw
from spheal_cleanup import clean_body, clean_inherited_base

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '8960f70fb409684bb69ad07a5e035282a963af52'
ASSETS = Path('src/assets/characters/spheal')
EVIDENCE = ROOT / 'docs/spheal-specials'
NEAREST = Image.Resampling.NEAREST


def raw_original(relative, commit=BASELINE):
    data = subprocess.check_output(['git', 'show', f'{commit}:{ASSETS / relative}'], cwd=ROOT)
    return Image.open(io.BytesIO(data)).convert('RGBA')


def original(relative, commit=BASELINE):
    source = raw_original(relative, commit)
    if commit != BASELINE:
        return source  # Historical comparison images stay historical.
    if relative == 'spheal-base.png' or relative.startswith('roll-'):
        return clean_body(source)
    if relative.startswith('animations/watergun/'):
        base = raw_original('spheal-base.png')
        return clean_inherited_base(source, base, clean_body(base))
    return source


def save(im, relative):
    target = ROOT / ASSETS / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target)


def clap(index):
    im = original(f'animations/clap/clap-{index:02}.png')
    # Rebuild the existing two fin roots and belly between them, not extra hands.
    # Smile/head, body alpha silhouette and rounded lower belly remain untouched.
    for y in range(41, 59):
        cream = im.getpixel((40, max(y, 49)))
        for x in range(18, 63):
            if y < 48 and 28 <= x <= 49:
                continue  # Keep the entire approved smile and expression.
            r, g, b, a = im.getpixel((x, y))
            if a and r > 165 and g > 135 and b < 210 and r > b + 25:
                im.putpixel((x, y), cream)
    d = ImageDraw.Draw(im)
    # Down → lift → reach → contact (two frames) → separate → lower.
    reach = [0, 5, 11, 16, 16, 11, 5, 0][index - 1]
    tip_x, tip_y = 24 + reach, 55 - round(reach * .31)
    left = [(20, 46), (23, 47), (tip_x - 3, tip_y - 3), (tip_x, tip_y - 2),
            (tip_x, tip_y), (tip_x - 2, tip_y + 2), (23, 56), (20, 53), (18, 50)]
    right = [(81 - x, y) for x, y in left]
    for points, side in [(left, 1), (right, -1)]:
        d.polygon(points, fill=(246, 218, 148, 255))
        # Partial warm contour follows each fin's lower edge; never a belly-wide line.
        d.polygon(points[4:7], fill=(233, 204, 143, 255))
        d.line(points[3:6], fill=(193, 157, 91, 255), width=1)
        d.line(points[0:3], fill=(255, 239, 179, 255), width=1)
    if index in (4, 5):
        # Retain the small original clap impact, centered at the actual contact.
        d.point((39, 48), fill='#fff8ce')
        d.point((42, 47), fill='#fff8ce')
    return im


def open_mouth():
    im = Image.new('RGBA', (120, 80))
    im.paste(original('spheal-base.png'), (20, 0))
    d = ImageDraw.Draw(im)
    # One shared snout/chin shape for both attacks. Nose at (45,30) stays visible.
    # Stepped upper lip follows the blue snout instead of a detached red ellipse.
    d.polygon([(35, 36), (38, 34), (43, 34), (46, 35), (50, 37),
               (53, 40), (53, 46), (51, 50), (47, 53), (41, 53),
               (37, 51), (34, 47), (33, 41)], fill='#6d5a62')
    d.polygon([(36, 37), (39, 35), (43, 35), (47, 37), (51, 40),
               (52, 43), (51, 47), (48, 51), (42, 52), (38, 50),
               (35, 46), (34, 42)], fill='#453449')
    d.polygon([(36, 46), (40, 46), (43, 47), (48, 47), (50, 46),
               (48, 50), (45, 51), (41, 51), (38, 49)], fill='#d46f83')
    d.line([(38, 47), (41, 47), (44, 48)], fill='#ef9b9d')
    d.line([(39, 54), (43, 55), (48, 54), (51, 52)], fill='#ffe8ad')
    return im


def draw_squint(d, dx=0, color='#253b63'):
    d.line([(36 + dx, 22), (39 + dx, 25), (36 + dx, 28)], fill=color)
    d.line([(59 + dx, 22), (56 + dx, 25), (59 + dx, 28)], fill=color)


def squint_face():
    """Restore original cheek shading, replacing only original eye pixels.

    Shared face for water shake and ice shatter. Sample existing blue pixels
    around each eye; no flat rectangular patches or extra chevrons on the snout.
    """
    base = Image.new('RGBA', (120, 80))
    base.paste(original('spheal-base.png'), (20, 0))
    clean = base.copy()
    eye_boxes = [(33, 20, 43, 29), (51, 20, 64, 31)]

    def skin(pixel):
        r, g, b, a = pixel
        return a > 240 and b > r + 30 and b > g + 25 and b > 190 and g > 130

    for x0, y0, x1, y1 in eye_boxes:
        candidates = [(x, y) for y in range(y0 - 3, y1 + 4)
                      for x in range(x0 - 3, x1 + 4)
                      if not (x0 <= x < x1 and y0 <= y < y1) and skin(base.getpixel((x, y)))]
        for y in range(y0, y1):
            for x in range(x0, x1):
                if not skin(base.getpixel((x, y))):
                    sample = min(candidates, key=lambda p: (p[0] - x) ** 2 + 2 * (p[1] - y) ** 2)
                    clean.putpixel((x, y), base.getpixel(sample))
    d = ImageDraw.Draw(clean)
    draw_squint(d)
    # Never alter source alpha, mouth, nose, or cheeks outside this face patch.
    clean.putalpha(base.getchannel('A'))
    return clean


# Short, round water droplets: phase 09 starts, 10 fans outward, 11 trails off.
# Coordinates are local to the 120x80 sprite; never repaint existing pixels.
SHAKE_DROPS = {
    9: [[22,23,1],[16,38,2],[22,53,1],[29,10,1],[45,5,1],[91,18,2],[102,32,1],[105,49,2],[94,64,1],[73,7,1],[13,58,1]],
    10: [[14,21,2],[10,39,1],[14,57,2],[27,71,1],[36,5,1],[103,17,2],[112,36,2],[111,57,1],[98,69,2],[58,4,1],[88,5,2],[7,51,1],[108,27,1]],
    11: [[10,27,1],[7,46,1],[17,67,1],[34,73,1],[106,23,1],[113,41,1],[111,62,2],[92,71,1],[45,4,1],[88,3,1]],
}
SHAKE_PALETTE = ((58, 151, 206, 255), (95, 199, 232, 255), (213, 247, 255, 255))


def shake_footprint(size):
    if size == 1:
        return ((0, 0, 0), (0, -1, 2))
    return ((0, -2, 2), (-1, -1, 1), (0, -1, 1), (1, -1, 0),
            (-1, 0, 0), (0, 0, 1), (1, 0, 1), (0, 1, 0))


def shake_droplets(im, index):
    for x, y, size in SHAKE_DROPS[index]:
        footprint = [(x + dx, y + dy, shade) for dx, dy, shade in shake_footprint(size)]
        # Existing silhouette and already-approved effects take precedence.
        if any(not (1 <= px < 119 and 1 <= py < 79) or im.getpixel((px, py))[3]
               for px, py, _ in footprint):
            continue
        for px, py, shade in footprint:
            im.putpixel((px, py), SHAKE_PALETTE[shade])
    return im


def water(index):
    old = original(f'animations/watergun/watergun-{index:02}.png')
    if 9 <= index <= 11:
        # Remove misplaced old chevrons/flat eye blocks using original face art.
        alpha = old.getchannel('A')
        old.paste(squint_face().crop((32, 19, 78, 34)), (32, 19))
        old.putalpha(alpha)
        return shake_droplets(old, index)
    if index not in range(4, 9):
        return old
    im = open_mouth()
    # Preserve Patch 23's animated single column, cap and internal moving dashes.
    for y in range(35, 49):
        for x in range(0, 39):
            r, g, b, a = old.getpixel((x, y))
            if a and b > r + 25 and g > r + 40:
                im.putpixel((x, y), (r, g, b, a))
    # Extend INTO the dark opening; a small shadow at the back establishes depth.
    d = ImageDraw.Draw(im)
    d.rectangle((38, 38, 43, 47), fill='#43c2e8')
    d.rectangle((42, 39, 44, 46), fill='#349fc4')
    d.line([(37, 40 + index % 3), (41, 40 + index % 3)], fill='#88e6fa')
    return im


def crystal(d, x, y, size=2, color='#b9eeff'):
    d.polygon([(x, y - size), (x + size, y), (x, y + size), (x - size, y)], fill=color)
    d.line([(x, y - size + 1), (x, y + size - 1)], fill='#f3fdff')


def ice_beam(index):
    im = open_mouth()
    d = ImageDraw.Draw(im)
    if index <= 2:  # 350ms, mouth opens and gathers cold (no water droplets).
        for x, y in [(26, 33), (32, 51), (45, 25)][:index + 1]:
            crystal(d, x, y, 1)
        d.line([(36, 41), (39, 40), (42, 42)], fill='#d8f7ff', width=2)
    elif index <= 8:  # Six distinct firing frames, 900ms total.
        phase = index - 3
        tip = [10, 6, 3, 5, 4, 8][phase]
        d.polygon([(44, 37), (tip + 5, 37), (tip + 2, 39), (tip, 42),
                   (tip + 2, 45), (tip + 6, 48), (44, 48)], fill='#83d9f4')
        d.polygon([(43, 39), (tip + 5, 39), (tip + 2, 42),
                   (tip + 6, 46), (43, 46)], fill='#c3f2ff')
        d.rectangle((42, 39, 44, 46), fill='#72badb')
        for j in range(3):
            x = tip + 5 + (j * 8 + phase * 3) % max(1, 33 - tip)
            y = 39 + (j + phase) % 5
            d.line([(x, y + 1), (x + 2, y), (x + 4, y)], fill='#f3fdff')
        # Exactly three angular crystals around, never parallel secondary rays.
        for j, x in enumerate([12, 24, 34]):
            crystal(d, x + phase % 2, (32 if j % 2 == 0 else 53) + phase % 3, 2)
    else:
        base = Image.new('RGBA', (120, 80))
        base.paste(original('spheal-base.png'), (20, 0))
        if index == 14:  # exact original colors, mouth and dimensions restored.
            return base
        if 10 <= index <= 13:
            base = squint_face()
        offset = {9: 0, 10: -1, 11: 2, 12: -2, 13: 1}[index]
        shifted = Image.new('RGBA', base.size)
        shifted.paste(base, (offset, 0))
        im = shifted
        # Conformal translucent coating baked over the original alpha silhouette.
        # Preserve identifying pixels instead of hiding the pet behind an ice wall.
        strength = {9: .30, 10: .28, 11: .22, 12: .13, 13: .06}[index]
        for y in range(80):
            for x in range(120):
                r, g, b, a = im.getpixel((x, y))
                if a:
                    ice = (158, 226, 255)
                    im.putpixel((x, y), tuple(round(c * (1 - strength) + t * strength)
                                             for c, t in zip((r, g, b), ice)) + (a,))
        d = ImageDraw.Draw(im)
        if index <= 11:
            # A thin icy rim follows existing opaque silhouette pixels exactly.
            alpha = shifted.getchannel('A')
            for y in range(9, 72):
                for x in range(23, 98):
                    if alpha.getpixel((x, y)) and any(
                        not alpha.getpixel((x + dx, y + dy))
                        for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]
                    ):
                        im.putpixel((x, y), (174, 231, 249, alpha.getpixel((x, y))))
        if index <= 11:
            for line in [[(39, 21), (37, 24), (39, 27)], [(78, 37), (75, 40), (77, 43)],
                         [(49, 61), (53, 59), (56, 60)]]:
                d.line([(x + offset, y) for x, y in line], fill='#d7f5ff')
        if index >= 10:
            # Short cracks branch only as shaking begins, never during the hold.
            d.line([(62 + offset, 17), (59 + offset, 24), (63 + offset, 28)], fill='#69b3d4')
            d.line([(60 + offset, 23), (55 + offset, 23)], fill='#69b3d4')
            spread = (index - 10) * 3
            for x, y, size in [(23 - spread, 34, 2), (95 + spread, 45, 2),
                               (42 - spread, 12 - spread // 2, 1), (79 + spread, 67, 1)]:
                crystal(d, x, y, size)
        if index == 9:
            im.putalpha(base.getchannel('A'))
        else:
            # Keep the expression readable where a reflection crosses the eyes.
            alpha = im.getchannel('A')
            ink = tuple(round(c * (1 - strength) + t * strength)
                        for c, t in zip((37, 59, 99), (158, 226, 255)))
            draw_squint(ImageDraw.Draw(im), offset, ink)
            im.putalpha(alpha)
    return im


def sheet(frames, title, columns=4):
    rows = (len(frames) + columns - 1) // columns
    out = Image.new('RGB', (columns * 250, rows * 190 * 2))
    d = ImageDraw.Draw(out)
    for bg_index, bg in enumerate(['#fff6e8', '#252b38']):
        d.rectangle((0, bg_index * rows * 190, out.width, (bg_index + 1) * rows * 190), fill=bg)
        for i, im in enumerate(frames):
            x, y = i % columns * 250, (i // columns + bg_index * rows) * 190
            zoom = im.resize((im.width * 2, im.height * 2), NEAREST)
            out.paste(zoom, (x, y + 22), zoom)
            d.text((x + 5, y + 4), f'{title} {i + 1:02}', fill='#74829b')
    return out


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    # Rebuild runtime body assets from pinned originals, never from the portrait.
    # Clean before adding droplets/crystals/coating, so intentional FX survive.
    for relative in ['spheal-base.png'] + [f'roll-{i:02}.png' for i in range(1, 13)]:
        save(original(relative), relative)
    for name, count, generator, durations in [
        ('clap', 8, clap, [180] * 8),
        ('watergun', 12, water, [175] * 12),
        ('icebeam', 14, ice_beam, [175, 175] + [150] * 6 + [1000] + [125] * 4 + [200]),
    ]:
        frames = [generator(i) for i in range(1, count + 1)]
        for i, im in enumerate(frames, 1):
            save(im, f'animations/{name}/{name}-{i:02}.png')
        sheet(frames, name).save(EVIDENCE / f'{name}-sheet.png')
        # Lossless RGBA animated PNG; preserve the exactly timed freeze hold.
        frames[0].save(EVIDENCE / f'{name}-playback.png', save_all=True,
                       append_images=frames[1:], duration=durations, loop=0,
                       disposal=0, blend=0)
    before = [raw_original('animations/clap/clap-04.png'), raw_original('animations/watergun/watergun-06.png')]
    after = [clap(4), water(6)]
    sheet([before[0], after[0], before[1], after[1]], 'before / after').save(EVIDENCE / 'comparison.png')
    polish_baseline = 'a4f66fef0fb70576bdeef8ea303d3593e438ce1d'
    eyes = sheet([original('animations/watergun/watergun-09.png', polish_baseline), water(9),
                  original('animations/icebeam/icebeam-10.png', polish_baseline), ice_beam(10)], 'eyes')
    d = ImageDraw.Draw(eyes)
    for row in [0, 190]:
        for column, label in enumerate(['WATER 09 before', 'WATER 09 after', 'ICE 10 before', 'ICE 10 after']):
            d.rectangle((column * 250, row, column * 250 + 249, row + 21), fill='#777f8b')
            d.text((column * 250 + 5, row + 4), label, fill='white')
    eyes.save(EVIDENCE / 'eyes-comparison.png')


    # Reproducible approved before/after on white and dark backgrounds.
    shake_before = [original(f'animations/watergun/watergun-{i:02}.png', '003aeb2fd33133db4bbe0b7631fc5739e97b83b0')
                    for i in (9, 10, 11)]
    shake_after = [water(i) for i in (9, 10, 11)]
    comparison = Image.new('RGB', (240, 480))
    for row, bg in enumerate(('#ffffff', '#252b38')):
        for col, group in enumerate((shake_before, shake_after)):
            for j, frame in enumerate(group):
                tile = Image.new('RGB', (120, 80), bg)
                tile.paste(frame, (0, 0), frame)
                comparison.paste(tile, (col * 120, (row * 3 + j) * 80))
    comparison.save(EVIDENCE / 'watergun-shake-comparison.png')

if __name__ == '__main__':
    main()
