"""Verify fixed-size eaten silhouettes, preserved source bytes and complete frames."""
import unittest, hashlib, json
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
 def test_diagonal_heads_and_facing_independent_rear_layer(self):
  timing=json.loads((A/'followme/timing.json').read_text())
  self.assertEqual(timing['duration'],4400);self.assertEqual(timing['iconUntil'],3500)
  a,b=[next(h for h in timing['frames'][i]['meteorHeads'] if h[0]==0) for i in [6,11]]
  self.assertLess(b[1],a[1]);self.assertGreater(b[2],a[2]);self.assertGreater(abs(b[1]-a[1])/(b[2]-a[2]),.8)
  from PIL import ImageOps
  for i in range(44):
   left=Image.open(A/'followme'/f'followme-{i:02}.png').convert('RGBA')
   right=ImageOps.mirror(Image.open(A/'followme-right'/f'followme-{i:02}.png').convert('RGBA'))
   self.assertEqual(left.size,(180,150));self.assertEqual(right.size,(180,150))
   # No body in this top strip: the meteor trajectory stays identical in screen
   # coordinates after the existing runtime facing transform.
   if timing['frames'][i]['meteorHeads']:
    self.assertEqual(left.crop((0,0,180,42)).tobytes(),right.crop((0,0,180,42)).tobytes())
   # Empty border avoids accidental chopped cores/tails and stray off-canvas pixels.
   for im in [left,right]:
    self.assertFalse(im.getchannel('A').crop((0,0,180,1)).getbbox())
    self.assertFalse(im.getchannel('A').crop((0,149,180,150)).getbbox())
if __name__=='__main__':unittest.main()
