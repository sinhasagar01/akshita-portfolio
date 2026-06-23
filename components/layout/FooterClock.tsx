"use client";

import { useEffect, useState } from "react";

function getKolkataTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export default function FooterClock() {
  const [display, setDisplay] = useState("9:41 pm");

  useEffect(() => {
    setDisplay(getKolkataTime());
    const id = setInterval(() => setDisplay(getKolkataTime()), 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-6">
      <p className="text-[10px] tracking-[.18em] uppercase font-semibold text-[--color-text-subtle]">
        Local time
      </p>
      <div className="flex items-center gap-[10px] mt-[7px]">
        <span
          className="inline-flex items-center gap-2 rounded-full px-[13px] py-[6px] text-[14px] text-[--color-text-primary]"
          style={{ border: "1px solid rgba(120,90,60,0.25)" }}
        >
          <span
            className="footer-dot w-[7px] h-[7px] rounded-full shrink-0"
            style={{ backgroundColor: "var(--color-accent-500)" }}
            aria-hidden="true"
          />
          <span>{display}</span>
        </span>
        <span className="text-[13px] text-[--color-text-subtle]">IST · Bengaluru</span>
      </div>
    </div>
  );
}
