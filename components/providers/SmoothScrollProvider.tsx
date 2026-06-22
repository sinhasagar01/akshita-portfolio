"use client";

import {
  ReactNode,
  MutableRefObject,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { useReducedMotion } from "motion/react";
import { ReactLenis, useLenis } from "lenis/react";
import { ScrollTrigger } from "@/lib/gsap";

type LenisInstance = NonNullable<ReturnType<typeof useLenis>>;
type ScrollTarget  = Parameters<LenisInstance["scrollTo"]>[0];
type ScrollOpts    = Parameters<LenisInstance["scrollTo"]>[1];

interface SmoothScrollCtx {
  scrollToTarget: (target: ScrollTarget, options?: ScrollOpts) => void;
  isProgrammaticRef: MutableRefObject<boolean>;
}

const SmoothScrollContext = createContext<SmoothScrollCtx | null>(null);

export function useSmoothScroll(): SmoothScrollCtx | null {
  return useContext(SmoothScrollContext);
}

function LenisBridge({
  lenisRef,
}: {
  lenisRef: MutableRefObject<LenisInstance | undefined>;
}) {
  const lenis = useLenis();
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis, lenisRef]);
  return null;
}

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReduced    = useReducedMotion();
  const lenisRef          = useRef<LenisInstance | undefined>(undefined);
  const isProgrammaticRef = useRef(false);
  const safetyTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    history.scrollRestoration = "manual";
  }, []);

  const scrollToTarget = useCallback(
    (target: ScrollTarget, options?: ScrollOpts) => {
      const lenis = lenisRef.current;
      if (!lenis) return;
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      isProgrammaticRef.current = true;
      lenis.scrollTo(target, {
        ...options,
        onComplete: (l: LenisInstance) => {
          isProgrammaticRef.current = false;
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          ScrollTrigger.update();
          options?.onComplete?.(l);
        },
      });
      safetyTimerRef.current = setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 2000);
    },
    [],
  );

  const ctx = useMemo<SmoothScrollCtx>(
    () => ({ scrollToTarget, isProgrammaticRef }),
    [scrollToTarget],
  );

  if (prefersReduced) return <>{children}</>;

  return (
    <SmoothScrollContext.Provider value={ctx}>
      <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, autoRaf: true }}>
        <LenisBridge lenisRef={lenisRef} />
        {children}
      </ReactLenis>
    </SmoothScrollContext.Provider>
  );
}
