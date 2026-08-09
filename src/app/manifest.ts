import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "swarnamaala.in - Custom Photo Magnets",
    short_name: "swarnamaala",
    description:
      "Create premium personalised custom photo magnets online and get them delivered across India.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#d97757",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
