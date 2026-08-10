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

## ⚠ The upscale is HEIGHT driven, and this note used to say width

It read **"on a display wider than ~2000px the panel will upscale"**, and that threshold never fires
first. The hero sizes the figure with `height` 100% and `width` auto inside a panel that clips its
overflow, so the figure always renders at the panel's height and its width is cropped. The binding
number is the 1024px source height against `100svh` multiplied by the display's DPR, not the 1033px
width against the panel's width.

| viewport | DPR | device px needed | upscale |
| --- | --- | --- | --- |
| 1440 × 900 | 2 | 1800 | 1.76× |
| 1512 × 982 | 2 | 1964 | 1.92× |
| 1728 × 1117 | 2 | 2234 | 2.18× |
| 1920 × 1080 | 1 | 1080 | 1.05× |
| 2560 × 1440 | 2 | 2880 | 2.81× |

Staying at or below 1× would need a window under 512 CSS px tall on a 2× display, which is no real
window. **The figure is therefore upscaled on every retina laptop, and that is accepted rather than
unnoticed.** A flat illustration upscales forgivingly. Her face softens, and re-cutting is a call the
owner makes later.

There is still no version above 1033 × 1024. The source PNG inside the SVG is 1536 × 1024, so
anything larger is a resample rather than an asset. The fix, if it is ever wanted, is a larger export
from the original artwork file.

**⚠ A STALE CLAIM IN AN ASSET NOTE IS ONE THE NEXT PERSON BUILDS ON.** This one survived because it
sounded like a fact about the file, and it was a fact about a layout nobody had written yet.
