import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HireME — Candidate-first hiring",
    short_name: "HireME",
    description: "Verified talent, autonomous hiring workflows, human decisions.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#17312c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
