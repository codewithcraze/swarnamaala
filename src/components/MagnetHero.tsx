"use client";

import dynamic from "next/dynamic";

// Browser-only WebGL scene — load on the client to avoid SSR issues.
const MagnetHeroScene = dynamic(() => import("./MagnetHeroScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="h-48 w-48 animate-pulse rounded-2xl bg-terracotta/15" />
    </div>
  ),
});

export default function MagnetHero() {
  return (
    <div className="relative h-[360px] w-full sm:h-[440px] lg:h-[520px]">
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/10 blur-3xl" />
      <MagnetHeroScene />
    </div>
  );
}
