"""Conservative cleanup of body-only extraction residues, never effect frames.

Keep the complete 8-connected strong body core (including dark outlines). Retain
adjacent translucent edge pixels when their RGB agrees with that outline.
Discard separate crop fragments and exterior background-colored alpha fringe.
No smoothing, erosion, RGB recoloring or blanket alpha threshold is applied.
"""


def clean_body(source):
    source = source.convert('RGBA')
    core = {(x, y) for y in range(source.height) for x in range(source.width)
            if source.getpixel((x, y))[3] >= 240}
    components = []
    while core:
        pending = [core.pop()]
        component = set(pending)
        while pending:
            x, y = pending.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbor = x + dx, y + dy
                    if neighbor in core:
                        core.remove(neighbor)
                        component.add(neighbor)
                        pending.append(neighbor)
        components.append(component)
    body = max(components, key=len)
    # Preserve every enclosed face/body pixel, including intentional translucency.
    exterior = set()
    pending = [(x, y) for y in range(source.height) for x in range(source.width)
               if x in (0, source.width - 1) or y in (0, source.height - 1)]
    while pending:
        x, y = pending.pop()
        if (x, y) in body or (x, y) in exterior:
            continue
        exterior.add((x, y))
        pending.extend((x + dx, y + dy) for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]
                       if 0 <= x + dx < source.width and 0 <= y + dy < source.height)
    result = source.copy()
    for y in range(source.height):
        for x in range(source.width):
            pixel = source.getpixel((x, y))
            if not pixel[3] or (x, y) in body or (x, y) not in exterior:
                continue
            # Retain original coverage/color at real adjacent outline pixels.
            # A weak bridge to a cropped neighboring sprite is not a body core.
            neighbors = [(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                         if (x + dx, y + dy) in body]
            matches_outline = any(sum(abs(a - b) for a, b in zip(
                pixel[:3], source.getpixel(p)[:3])) <= 96 for p in neighbors)
            if matches_outline:
                continue
            result.putpixel((x, y), (0, 0, 0, 0))
    return result


def clean_inherited_base(frame, raw_base, cleaned_base, dx=20):
    """Apply only verified source-body deletions; preserve overlaid effects.

    Water Gun source frames already contain droplets/streams. An exact RGBA
    match prevents a cleanup mask from deleting an effect at the same location.
    Ice effects are drawn AFTER cleaning the body, so they need no such mask.
    """
    frame = frame.copy()
    for y in range(raw_base.height):
        for x in range(raw_base.width):
            old, new = raw_base.getpixel((x, y)), cleaned_base.getpixel((x, y))
            if old != new and frame.getpixel((x + dx, y)) == old:
                frame.putpixel((x + dx, y), new)
    return frame
