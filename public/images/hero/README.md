# Hero assets

Drop this folder at `public/images/hero/`.

| file | what it is | notes |
| --- | --- | --- |
| `hero-figure.webp` | 1033 × 1024, RGBA | The illustration with the cream field removed. **Ship this one.** |
| `hero-figure@0.66x.webp` | 682 × 676, RGBA | For the ≤900px reflow, where the panel is ~390px wide. |
| `icon-cursor.svg` | 24 × 30 | `currentColor`. Replaces the CSS border-triangle. |
| `icon-spark.svg` | 40 × 40, stroke | `currentColor`. Replaces the `clip-path` polygon. |
| `icon-spark-solid.svg` | 40 × 40, filled | Alternative weight for light grounds. |
| `icon-arrow-scroll.svg` | 16 × 22 | `currentColor`. For the scroll cue if the dot is replaced. |
| `noise-tile.png` | 160 × 160, greyscale | Tileable. Only needed if the `feTurbulence` grain is measured too costly. |

## How the cutout was made, because it decides how to re-make it

The cream field was found by **flooding inward from the image border** over cream-like pixels,
and everything not connected to that border is content. That is what protects the white tee:
it is enclosed by the figure, so the fill can never reach it. Every threshold-based attempt
either ate the tee or left a halo.

**⚠ Two limits that travel with the asset.**

The drawn UI cards, the coral block and the purple disc are **still in the artwork** — they are
baked into the same flat raster as the figure and cannot be separated without repainting her
forearm, which the blue card overlaps. The synthetic pieces and the ember panels therefore sit
**beside** them, not instead of them.

There is no version above 1033 × 1024, because the source PNG inside the SVG is 1536 × 1024 and
the crop is what remains after the cream is removed. **On a display wider than ~2000px the panel
will upscale.** If that matters, the fix is a larger export from the original file, not a resample.
