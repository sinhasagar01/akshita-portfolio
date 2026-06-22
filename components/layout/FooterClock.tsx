"use client";

import { useEffect, useState } from "react";

function getKolkataTime() {
  return (
    "Local time " +
    new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
  );
}

export default function FooterClock() {
  const [display, setDisplay] = useState("Local time 9:41 PM");

  useEffect(() => {
    setDisplay(getKolkataTime());
    const id = setInterval(() => setDisplay(getKolkataTime()), 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="max-w-none mt-1.5 text-[13px] text-[--color-text-subtle]">
      {display}
    </p>
  );
}
