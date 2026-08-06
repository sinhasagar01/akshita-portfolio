import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/keystatic";
import { resolveTheme, THEME_SPLASH, BRAND_CHROME_COLOR } from "@/lib/theme";

/* ⚠ THE TWO COLOURS HERE DRAW DIFFERENT THINGS AND GET OPPOSITE ANSWERS.
 *
 *   background_color — the full-bleed PWA SPLASH while the installed app loads. It is the site's
 *                      OWN GROUND, so it follows the theme.
 *   theme_color      — the Android address bar and the task-switcher card. Chrome AROUND the site,
 *                      on a surface the site does not own, so it does not.
 *
 * Asking what each DRAWS is what separated them; asking what element they sit in would have made
 * them one decision. Both reasons live in `lib/theme.ts` beside their values.
 *
 * The route stays STATIC — the read is build-time and `cache()`-deduped with every page's. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  const theme = resolveTheme(settings?.theme);
  return {
    name: "Akshita Singh",
    short_name: "Akshita",
    description:
      "Product designer focused on enterprise and consumer experiences.",
    start_url: "/",
    display: "standalone",
    background_color: THEME_SPLASH[theme],
    theme_color: BRAND_CHROME_COLOR,
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
