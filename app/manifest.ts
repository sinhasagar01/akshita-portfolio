import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Akshita Singh",
    short_name: "Akshita",
    description:
      "Product designer focused on enterprise and consumer experiences.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6EE",
    theme_color: "#1c1813",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
