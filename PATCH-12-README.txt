Desktop Pet v0.1.9 Growlithe SVG rebuild

Growlithe was rebuilt as a component-based SVG character. The runtime no longer uses Growlithe sprite-sheet/background-position playback for IDLE/WALK/REACT/SLEEP. Body, legs, tail, head, ears, eyes, and mouth are separate SVG groups animated with CSS, matching the dog's character-layer approach. WALK uses in-place limb/body animation while Pet Engine moves the window; SLEEP closes the eyes and tucks the legs.
