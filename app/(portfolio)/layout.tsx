import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import ScrollManager from "@/components/providers/ScrollManager";
import GSAPProvider from "@/components/providers/GSAPProvider";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PageLoader from "@/components/motion/PageLoader";
import SkipLink from "@/components/layout/SkipLink";
import CustomCursor from "@/components/ui/CustomCursor";
import { getSiteSettings } from "@/lib/keystatic";
import { buildSiteLinks } from "@/lib/social-links";

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
      </GSAPProvider>
    </SmoothScrollProvider>
  );
}
