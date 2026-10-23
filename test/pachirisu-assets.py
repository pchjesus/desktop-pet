"""Verify fixed-size eaten silhouettes, preserved source bytes and complete frames."""
import unittest, hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'src/assets/characters/pachirisu'
class FollowMeAssets(unittest.TestCase):
 def test_bites_remove_pixels_instead_of_scaling(self):
  frames=[Image.open(A/'followme'/f'berry-{i}.png').convert('RGBA') for i in range(4)]
  self.assertEqual({im.size for im in frames},{(18,18)})
  sets=[{(x,y) for y in range(18) for x in range(18) if im.getpixel((x,y))[3]} for im in frames]
  for before,after in zip(sets,sets[1:]): self.assertLess(len(after),len(before));self.assertTrue(after<=before)
  self.assertEqual(len(sets[-1]),0)
  for im in frames[1:]:
   for xy in sets[0]:
    if im.getpixel(xy)[3]:self.assertEqual(im.getpixel(xy),frames[0].getpixel(xy))
 def test_frames_and_cleanup_are_alpha_pngs(self):
  for i in range(44):
   with Image.open(A/'followme'/f'followme-{i:02}.png') as im:
    self.assertEqual(im.size,(180,150));self.assertEqual(im.mode,'RGBA')
  end=Image.open(A/'followme/followme-43.png')
  clean=Image.new('RGBA',(180,150));clean.alpha_composite(Image.open(A/'pachirisu-still.png').resize((87,91),Image.Resampling.NEAREST),(43,27))
  self.assertEqual(end.tobytes(),clean.tobytes())
if __name__=='__main__':unittest.main()
