import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "swarnamaala.in - Custom Photo Magnets",
    short_name: "swarnamaala",
    description:
      "Create premium personalised custom photo magnets online and get them delivered across India.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#c68b2b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
