import type { MetadataRoute } from "next";

// PWA manifest. Lets Android (and increasingly iOS) treat the site as an
// installable app — with the From Victory flame as the home-screen icon.
// Brand background (#050505 onyx) + standalone display keeps the launch
// experience feeling like a native app rather than a browser tab.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "From Victory",
    short_name: "From Victory",
    description:
      "Compete from victory. Daily mental toughness training with faith at the foundation.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Maskable icon for Android adaptive icons and TWA.
        // Full 512×512 canvas is filled (#050505 onyx); the brand mark
        // (open-book V + flame) sits inside the center 65% — comfortably
        // within the maskable safe zone (center 80%).
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
