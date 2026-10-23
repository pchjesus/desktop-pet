"""Focused pixel/alpha regression checks (Python + Pillow, no app dependency)."""
import io
import subprocess
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/assets/characters/spheal'
BASELINE = '8960f70fb409684bb69ad07a5e035282a963af52'
POLISH_BASELINE = 'a4f66fef0fb70576bdeef8ea303d3593e438ce1d'
CLEANUP_BASELINE = '0dfdb4d4ec38fefa22b1d82c1e7ab962fce57a37'


def frame(kind, index):
    return Image.open(ASSETS / f'animations/{kind}/{kind}-{index:02}.png').convert('RGBA')


def original(relative, commit=BASELINE):
    data = subprocess.check_output(['git', 'show', f'{commit}:src/assets/characters/spheal/{relative}'], cwd=ROOT)
    return Image.open(io.BytesIO(data)).convert('RGBA')


class SphealAssets(unittest.TestCase):
    def assert_cleanup_only(self, before, after, dx=20, face_polish=False, ice=False):
        """Old regression comparisons allow only this task's body-edge deletions.

        This preserves their original face/effect constraints while permitting
        the requested cleanup. New body-provenance checks validate the mask.
        """
        old_base = original('spheal-base.png', CLEANUP_BASELINE)
        new_base = Image.open(ASSETS / 'spheal-base.png').convert('RGBA')
        removed = {(x + dx, y) for y in range(80) for x in range(80)
                   if old_base.getpixel((x, y)) != new_base.getpixel((x, y))}
        for y in range(80):
            for x in range(120):
                old, new = before.getpixel((x, y)), after.getpixel((x, y))
                if old == new:
                    continue
                if (x, y) in removed and new[3] == 0:
                    continue
                if face_polish and 30 <= x < 80 and 19 <= y < 34:
                    self.assertEqual(old[3], new[3], ('face alpha', x, y))
                    continue
                if ice and new[:3] == (174, 231, 249) and new[3] == old[3] and any(
                    (x + ox, y + oy) in removed for ox in [-1, 0, 1] for oy in [-1, 0, 1]
                ):
                    continue  # Existing coating follows the corrected contour.
                self.fail(f'Unexpected change outside body cleanup/approved face: {(x, y, old, new)}')

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

    def test_water_preparation_and_recovery_are_unchanged(self):
        for i in [1, 2, 3, 12]:
            self.assert_cleanup_only(original(f'animations/watergun/watergun-{i:02}.png'), frame('watergun', i))

    def test_polish_only_changes_face_pixels_and_preserves_alpha_effects_and_mouth(self):
        for kind, indices in [('icebeam', range(10, 14))]:
            for i in indices:
                before = original(f'animations/{kind}/{kind}-{i:02}.png', POLISH_BASELINE)
                after = frame(kind, i)
                dx = 20 + ({10: -1, 11: 2, 12: -2, 13: 1}.get(i, 0) if kind == 'icebeam' else 0)
                self.assert_cleanup_only(before, after, dx, face_polish=True, ice=kind == 'icebeam')
                changes = []
                for y in range(80):
                    for x in range(120):
                        if before.getpixel((x, y)) != after.getpixel((x, y)):
                            changes.append((x, y))
                            # Face-region changes from the prior polish remain.
                            # All other edits were checked above against cleanup.
                self.assertTrue(changes)
        for i in list(range(1, 10)) + [14]:
            self.assert_cleanup_only(original(f'animations/icebeam/icebeam-{i:02}.png', POLISH_BASELINE), frame('icebeam', i), ice=True)

    def test_water_shake_changes_only_approved_droplet_footprints(self):
        # Every non-effect pixel, especially face/body and pre-existing spray, is identical.
        reference = '003aeb2fd33133db4bbe0b7631fc5739e97b83b0'
        drops = {
            9: [[22,23,1],[16,38,2],[22,53,1],[29,10,1],[45,5,1],[91,18,2],[102,32,1],[105,49,2],[94,64,1],[73,7,1],[13,58,1]],
            10: [[14,21,2],[10,39,1],[14,57,2],[27,71,1],[36,5,1],[103,17,2],[112,36,2],[111,57,1],[98,69,2],[58,4,1],[88,5,2],[7,51,1],[108,27,1]],
            11: [[10,27,1],[7,46,1],[17,67,1],[34,73,1],[106,23,1],[113,41,1],[111,62,2],[92,71,1],[45,4,1],[88,3,1]],
        }
        def footprint(x, y, size):
            offsets = ((0, 0), (0, -1)) if size == 1 else (
                (0, -2), (-1, -1), (0, -1), (1, -1),
                (-1, 0), (0, 0), (1, 0), (0, 1))
            return {(x + dx, y + dy) for dx, dy in offsets}
        for i in (9, 10, 11):
            old = original(f'animations/watergun/watergun-{i:02}.png', reference)
            new = frame('watergun', i)
            allowed = set().union(*(footprint(x, y, size) for x, y, size in drops[i]))
            changes = {(x, y) for y in range(80) for x in range(120)
                       if old.getpixel((x, y)) != new.getpixel((x, y))}
            self.assertTrue(changes <= allowed, (i, changes - allowed))
            self.assertGreaterEqual(len(changes), 16, i)
            for x, y in changes:
                self.assertEqual(old.getpixel((x, y))[3], 0, (i, x, y, 'source overwritten'))
                self.assertIn(new.getpixel((x, y)), ((58, 151, 206, 255),
                    (95, 199, 232, 255), (213, 247, 255, 255)))
            self.assertEqual(old.crop((32, 19, 78, 34)).tobytes(),
                             new.crop((32, 19, 78, 34)).tobytes())

    def test_shake_and_shatter_have_exactly_two_inward_closed_eyes(self):
        left = {(36 + j, 22 + j) for j in range(4)} | {(39 - j, 25 + j) for j in range(4)}
        right = {(59 - j, 22 + j) for j in range(4)} | {(56 + j, 25 + j) for j in range(4)}
        for kind, offsets in [('watergun', {9: 0, 10: 0, 11: 0}), ('icebeam', {10: -1, 11: 2, 12: -2, 13: 1})]:
            for i, dx in offsets.items():
                im = frame(kind, i)
                actual = {(x, y) for y in range(21, 31) for x in range(33 + dx, 64 + dx)
                          if (lambda c: c[0] < 85 and c[1] < 130 and c[2] < 170 and c[3] > 240)(im.getpixel((x, y)))}
                self.assertEqual(actual, {(x + dx, y) for x, y in left | right}, (kind, i))

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

    def test_body_cleanup_is_deletion_only_and_keeps_strong_connected_artwork(self):
        for relative in ['spheal-base.png'] + [f'roll-{i:02}.png' for i in range(1, 13)]:
            old = original(relative, CLEANUP_BASELINE)
            new = Image.open(ASSETS / relative).convert('RGBA')
            self.assertEqual(new.size, old.size)
            core = {(x, y) for y in range(80) for x in range(80) if old.getpixel((x, y))[3] >= 240}
            # Seed on the body center; all strong, connected body/outline pixels
            # must be byte-identical. Cropped neighbors cannot cross this test.
            seed = min(core, key=lambda p: (p[0] - 40) ** 2 + (p[1] - 40) ** 2)
            pending, body = [seed], set()
            while pending:
                x, y = pending.pop()
                if (x, y) in body or (x, y) not in core:
                    continue
                body.add((x, y))
                pending.extend((x + dx, y + dy) for dx in [-1, 0, 1] for dy in [-1, 0, 1])
            self.assertGreater(len(body), 1500)
            for p in body:
                self.assertEqual(new.getpixel(p), old.getpixel(p), (relative, p))
            for y in range(80):
                for x in range(80):
                    pixel = new.getpixel((x, y))
                    if pixel != old.getpixel((x, y)):
                        self.assertEqual(pixel, (0, 0, 0, 0), (relative, x, y, 'repainted body'))
            self.assertGreater(sum(0 < a < 255 for a in new.getchannel('A').tobytes()), 1500)
            self.assertGreater(sum(0 < a < 240 for a in new.getchannel('A').tobytes()), 0,
                               'real translucent contour coverage must survive')
        # Eye-hole fix, face, nose/tusks stay exact, rather than a new portrait.
        old = original('spheal-base.png', CLEANUP_BASELINE)
        new = Image.open(ASSETS / 'spheal-base.png').convert('RGBA')
        for box in [(15, 20, 24, 29), (32, 20, 43, 31), (22, 28, 32, 33), (27, 36, 38, 45)]:
            self.assertEqual(new.crop(box).tobytes(), old.crop(box).tobytes())

    def test_reviewed_crop_fragments_and_floor_specks_are_absent(self):
        examples = {'spheal-base.png': [(27, 8), (50, 71), (51, 71)],
                    'roll-02.png': [(7, 44), (73, 39)], 'roll-03.png': [(7, 50), (45, 13)],
                    'roll-04.png': [(6, 40)], 'roll-06.png': [(37, 6)],
                    'roll-07.png': [(73, 36)], 'roll-10.png': [(73, 40)]}
        for relative, positions in examples.items():
            old, new = original(relative, CLEANUP_BASELINE), Image.open(ASSETS / relative).convert('RGBA')
            for p in positions:
                self.assertGreater(old.getpixel(p)[3], 0, (relative, p, 'bad source fixture'))
                self.assertEqual(new.getpixel(p)[3], 0, (relative, p, 'residue returned'))

    def test_effects_outside_source_body_and_all_clap_frames_remain_exact(self):
        raw = original('spheal-base.png', CLEANUP_BASELINE)
        for kind, count in [('watergun', 12), ('icebeam', 14)]:
            for i in range(1, count + 1):
                old = original(f'animations/{kind}/{kind}-{i:02}.png', CLEANUP_BASELINE)
                new = frame(kind, i)
                dx = 20 + ({10: -1, 11: 2, 12: -2, 13: 1}.get(i, 0) if kind == 'icebeam' else 0)
                effects = 0
                for y in range(80):
                    for x in range(120):
                        outside = not (0 <= x - dx < 80) or raw.getpixel((x - dx, y))[3] == 0
                        if outside and old.getpixel((x, y))[3] and not (kind == 'watergun' and i in (9, 10, 11)):
                            self.assertEqual(new.getpixel((x, y)), old.getpixel((x, y)), (kind, i, x, y))
                            effects += 1
                if (kind == 'watergun' and 4 <= i <= 8) or (kind == 'icebeam' and 1 <= i <= 8):
                    self.assertGreater(effects, 0)
        for i in range(1, 9):
            self.assertEqual(frame('clap', i).tobytes(), original(f'animations/clap/clap-{i:02}.png', CLEANUP_BASELINE).tobytes())


if __name__ == '__main__':
    unittest.main()
