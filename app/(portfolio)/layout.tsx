import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import ScrollManager from "@/components/providers/ScrollManager";
import GSAPProvider from "@/components/providers/GSAPProvider";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PageLoader from "@/components/motion/PageLoader";
import SkipLink from "@/components/layout/SkipLink";
import CustomCursor from "@/components/ui/CustomCursor";
import PreviewIndicator from "@/components/palettes/PreviewIndicator";
import { getSiteSettings } from "@/lib/keystatic";
import { buildSiteLinks } from "@/lib/social-links";
import { DEFAULT_THEME } from "@/lib/theme";

export default async function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The site chrome sources its links from the singleton (PL-2a). This is the
  // live/published read — the public header and footer never show draft links.
  const settings = await getSiteSettings();
  const links = buildSiteLinks(settings);

  return (
    <SmoothScrollProvider>
      <ScrollManager />
      <GSAPProvider>
        <SkipLink />
        <PageLoader />
        <CustomCursor />
        <SiteHeader links={links} />
        {children}
        <SiteFooter links={links} />
        {/* ⚠ IN THE PORTFOLIO LAYOUT, WHICH IS THE ONLY SCOPE THAT COVERS EVERY PUBLIC PAGE AND NO
            STUDIO ONE. The preview follows the visitor across the site, so the thing that tells
            them why — and the way out — has to follow too. It renders nothing when no preview is
            live, so it costs an empty component on every page and no markup. */}
        {/* ⚠ THE PUBLISHED THEME IS SERVER-READ HERE, so the arrival strip can be decided on EVERY
            public page rather than only where the four dots are. The homepage teaser already says
            this beside its dots; a visitor who lands on /blog while the site is on cerise learns
            nothing without this. */}
        <PreviewIndicator publishedTheme={settings?.theme ?? DEFAULT_THEME} />
      </GSAPProvider>
    </SmoothScrollProvider>
  );
}
