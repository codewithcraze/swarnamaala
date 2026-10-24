"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useLazyMount } from "@/lib/useLazyMount";

// Browser-only WebGL scene. No placeholder box — the magnets simply fly in
// once the scene is ready, so there is no background or border.
const MagnetHeroScene = dynamic(() => import("./MagnetHeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function MagnetHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, visible } = useLazyMount(ref);

  return (
    <div ref={ref} className="relative h-[320px] w-full sm:h-[420px] lg:h-[540px]">
      {mounted && <MagnetHeroScene active={visible} />}
    </div>
  );
}
