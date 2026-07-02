"use client";

// GH-6 — owner login form. Posts the password to the existing /api/studio/login
// route (constant-time compare + throttle server-side). The password lives only
// in local state, is never logged or echoed, and is sent over the fetch body.
// On success a full navigation to /studio lets the (dashboard) layout re-run
// with the freshly set httpOnly cookie.
import { useState } from "react";
import { IconSparkles } from "./icons";

type Status = "idle" | "submitting" | "error";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting" || !password) return;
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/studio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full navigation so the gated layout re-runs with the new cookie.
        window.location.assign("/studio");
        return;
      }
      if (res.status === 429) {
        setMessage("Too many attempts, wait a moment");
      } else if (res.status === 401) {
        setMessage("Wrong password");
      } else {
        setMessage("Could not sign in. Try again.");
      }
      setStatus("error");
    } catch {
      setMessage("Could not sign in. Try again.");
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50"
    >
      <div className="flex items-center gap-2.5 border-b border-ink-950/8 bg-cream-100 px-5 py-4">
        <span className="grid size-6 place-items-center rounded-md bg-accent-500 text-cream-50">
          <IconSparkles className="size-3.5" />
        </span>
        <span className="font-display text-lg text-ink-950">Studio</span>
      </div>

      <div className="flex flex-col gap-4 px-5 py-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <p className="min-h-[16px] text-[12px] text-accent-600" aria-live="polite">
          {status === "error" ? message : ""}
        </p>

        <button
          type="submit"
          disabled={status === "submitting" || !password}
          className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
