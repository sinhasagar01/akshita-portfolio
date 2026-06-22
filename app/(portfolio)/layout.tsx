import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import GSAPProvider from "@/components/providers/GSAPProvider";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PageLoader from "@/components/motion/PageLoader";
import CustomCursor from "@/components/ui/CustomCursor";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrollProvider>
      <GSAPProvider>
        <PageLoader />
        <CustomCursor />
        <SiteHeader />
        {children}
        <SiteFooter />
      </GSAPProvider>
    </SmoothScrollProvider>
  );
}
