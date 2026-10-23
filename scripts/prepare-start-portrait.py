"""Make a crisp startup-only Spheal portrait from original RGB pixels (Pillow).

Keep the connected opaque body; discard source export fringe speckles.
Runtime base/animation images are never edited or resampled.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'src/assets/characters/spheal'
source = Image.open(root / 'spheal-base.png').convert('RGBA')
pixels = {(x, y) for y in range(source.height) for x in range(source.width)
          if source.getpixel((x, y))[3] >= 128}
components = []
while pixels:
    pending = [pixels.pop()]
    component = set(pending)
    while pending:
        x, y = pending.pop()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            neighbor = (x + dx, y + dy)
            if neighbor in pixels:
                pixels.remove(neighbor)
                component.add(neighbor)
                pending.append(neighbor)
    components.append(component)
portrait = Image.new('RGBA', source.size)
body = max(components, key=len)
for pixel in body:
    portrait.putpixel(pixel, source.getpixel(pixel)[:3] + (255,))
portrait.save(root / 'spheal-portrait.png')
assert portrait.size == (80, 80)
assert all(portrait.getpixel(p)[:3] == source.getpixel(p)[:3] for p in body)
print(f'Startup portrait: original RGB retained in {len(body)} body pixels; alpha 0/255.')
