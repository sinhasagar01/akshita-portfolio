"use client";

// GH-6 — owner login form. Posts the password to the existing /api/studio/login
// route (constant-time compare + throttle server-side). The password lives only
// in local state, is never logged or echoed, and is sent over the fetch body.
// On success a full navigation to /studio lets the (dashboard) layout re-run
// with the freshly set httpOnly cookie.
import { useState } from "react";
import { IconSparkles } from "./icons";
import { inputClsMd, FieldKey} from "./blocks/fields";

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
      className="w-full max-w-sm overflow-hidden rounded-[var(--studio-radius-panel,12px)] border border-studio-ink-950/22 bg-studio-cream-50"
    >
      {/* CHROME IS cream-200, and it moves because the BODY moved, not as a separate opinion.
          The body below had no ground of its own, so it inherited the form's cream-50 and the
          password well (cream-50) collided with it at 1.00. Fixing the body to cream-100 alone
          would have left this header ALSO cream-100 — one same-on-same traded for another. The
          ladder resolves the pair in one step: chrome cream-200, field surface cream-100, well
          cream-50. That is the relational rule doing the deriving (blocks/fields.tsx:151-166). */}
      <div className="flex items-center gap-2.5 border-b border-studio-ink-950/12 bg-studio-cream-200 px-5 py-4">
        <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500 text-studio-cream-50">
          <IconSparkles className="size-3.5" />
        </span>
        <span className="font-display text-lg text-studio-ink-950">Studio</span>
      </div>

      <div className="flex flex-col gap-4 bg-studio-cream-100 px-5 py-6">
        <label className="flex flex-col gap-1.5">
          <FieldKey>Password</FieldKey>
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
            className={inputClsMd}
          />
        </label>

        <p className="min-h-[16px] text-[12px] text-studio-accent-600" aria-live="polite">
          {status === "error" ? message : ""}
        </p>

        <button
          type="submit"
          disabled={status === "submitting" || !password}
          className="rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500 px-4 py-2 text-[14px] font-medium text-studio-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
