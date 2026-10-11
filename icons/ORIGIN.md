# Icon

## Design

The icon is a set of sliders on a teal rounded square, standing for the player controls and quality settings the extension adds. A dark circular badge sits at the bottom right, with a thick white **+** and a white ring that separates it from the square. It is drawn flat, front-on, with no text and a transparent background.

It was drawn from scratch for this extension, with no icon set and no third-party artwork. It deliberately avoids:

- apples and other fruit;
- Apple's logos and the Apple TV logo;
- the black rounded square with a white glyph used by the Apple TV app;
- SF Symbols;
- other brands' marks, such as a red play button or a red "N".

An earlier version used an apple and was replaced, because Apple's trademark guidelines forbid any image of an apple; see [docs/publishing.md](../docs/publishing.md).

## Files

- **`icon.svg`:** the source for 32, 48, 64, 96 and 128 px, with three sliders.
- **`icon-small.svg`:** the 16 px version. It has two sliders with thicker tracks and bigger knobs, plus a larger badge, so it stays readable in the toolbar.
- **`icon-*.png`:** exported from the SVGs at each exact size with a transparent background, using headless Chromium, then recompressed losslessly. Nothing was downscaled from a larger PNG.
