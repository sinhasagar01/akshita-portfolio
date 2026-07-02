import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // GH-12 — the /studio routes and the save-draft route are dynamic (cookie
  // gate), so on Vercel they run as serverless functions bundled from the
  // output file trace. The Keystatic local reader reads content/ via fs at
  // runtime, which static tracing cannot see, so without this the deployed
  // functions ship WITHOUT content and every /studio page renders empty.
  // Keys are picomatch globs matched against route paths. content/ is yaml and
  // mdoc text only (images live in public/), so the bundle cost is tiny.
  outputFileTracingIncludes: {
    "/studio{,/**}": ["./content/**/*"],
    "/api/studio/save-draft": ["./content/**/*"],
  },
};

export default nextConfig;
