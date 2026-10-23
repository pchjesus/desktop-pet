"""Focused pixel/alpha regression checks (Python + Pillow, no app dependency)."""
import io
import subprocess
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets/characters/spheal'
BASELINE = '8960f70fb409684bb69ad07a5e035282a963af52'


def frame(kind, index):
    return Image.open(ASSETS / f'animations/{kind}/{kind}-{index:02}.png').convert('RGBA')


def original(relative):
    data = subprocess.check_output(['git', 'show', f'{BASELINE}:src/assets/characters/spheal/{relative}'], cwd=ROOT)
    return Image.open(io.BytesIO(data)).convert('RGBA')


class SphealAssets(unittest.TestCase):
    def test_dimensions_alpha_and_margin(self):
        for kind, count, size in [('clap', 8, (80, 80)), ('watergun', 12, (120, 80)), ('icebeam', 14, (120, 80))]:
            for index in range(1, count + 1):
                im = frame(kind, index)
                self.assertEqual(im.size, size)
                self.assertEqual(im.getpixel((0, 0))[3], 0)
                x0, y0, x1, y1 = im.getbbox()
                self.assertGreater(x0, 0)
                self.assertGreater(y0, 0)
                self.assertLess(x1, size[0])
                self.assertLess(y1, size[1])

    def test_clap_preserves_silhouette_expression_and_has_two_touching_fins(self):
        for i in range(1, 9):
            before = original(f'animations/clap/clap-{i:02}.png')
            after = frame('clap', i)
            self.assertEqual(before.getchannel('A').tobytes(), after.getchannel('A').tobytes())
            self.assertEqual(before.crop((30, 0, 48, 47)).tobytes(), after.crop((30, 0, 48, 47)).tobytes())
            # Every changed pixel is confined to the original fin/root region.
            for y in range(80):
                for x in range(80):
                    if before.getpixel((x, y)) != after.getpixel((x, y)):
                        self.assertTrue(18 <= x <= 63 and 41 <= y < 59, (i, x, y))
        for i in [4, 5]:
            self.assertEqual(frame('clap', i).getpixel((40, 50)), frame('clap', i).getpixel((41, 50)))
        self.assertEqual(frame('clap', 4).tobytes(), frame('clap', 5).tobytes())

    def test_water_shake_and_preparation_are_unchanged(self):
        for i in [1, 2, 3, 9, 10, 11, 12]:
            self.assertEqual(frame('watergun', i).tobytes(), original(f'animations/watergun/watergun-{i:02}.png').tobytes())

    def test_shared_mouth_nose_and_single_connected_attack_columns(self):
        mouth = frame('watergun', 4).crop((45, 34, 55, 55)).tobytes()
        base = Image.new('RGBA', (120, 80))
        base.paste(Image.open(ASSETS / 'spheal-base.png'), (20, 0))
        for kind, indices in [('watergun', range(4, 9)), ('icebeam', range(3, 9))]:
            previous = None
            for i in indices:
                im = frame(kind, i)
                self.assertEqual(im.crop((45, 34, 55, 55)).tobytes(), mouth)
                self.assertEqual(im.crop((43, 28, 49, 33)).tobytes(), base.crop((43, 28, 49, 33)).tobytes())
                pixels = {(x, y) for x in range(45) for y in range(37, 49)
                          if (lambda c: c[3] and c[2] > c[0] + 20 and c[1] > c[0] + 20)(im.getpixel((x, y)))}
                seen = set()
                pending = [next(iter(pixels))]
                while pending:
                    p = pending.pop()
                    if p in seen or p not in pixels:
                        continue
                    seen.add(p)
                    x, y = p
                    pending += [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                self.assertEqual(seen, pixels, (kind, i, 'disconnected beam'))
                self.assertGreaterEqual(max(x for x, _ in pixels), 43)  # inside mouth
                self.assertGreaterEqual(max(y for _, y in pixels) - min(y for _, y in pixels), 8)
                if previous is not None:
                    self.assertNotEqual(previous, im.tobytes(), 'firing art must move')
                previous = im.tobytes()

    def test_freeze_coating_follows_body_and_recovery_is_exact(self):
        base = Image.new('RGBA', (120, 80))
        base.paste(Image.open(ASSETS / 'spheal-base.png'), (20, 0))
        frozen = frame('icebeam', 9)
        self.assertEqual(frozen.getchannel('A').tobytes(), base.getchannel('A').tobytes())
        self.assertNotEqual(frozen.tobytes(), base.tobytes())
        self.assertEqual(frame('icebeam', 14).tobytes(), base.tobytes())

    def test_animated_evidence_has_exact_total_and_frozen_hold(self):
        for kind, total in [('clap', 1440), ('watergun', 2100), ('icebeam', 2950)]:
            im = Image.open(ROOT / f'docs/spheal-specials/{kind}-playback.png')
            elapsed, freeze = 0, []
            for index in range(im.n_frames):
                im.seek(index)
                duration = im.info['duration']
                elapsed += duration
                if kind == 'icebeam' and duration == 1000:
                    freeze.append(im.convert('RGBA').tobytes())
            self.assertEqual(elapsed, total)
            if kind == 'icebeam':
                self.assertEqual(freeze, [frame('icebeam', 9).tobytes()])
            im.close()


if __name__ == '__main__':
    unittest.main()
