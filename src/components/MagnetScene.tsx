"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadMagnetTexture } from "@/lib/magnetTexture";

// Real magnet: 90mm x 65mm flat slab with sharp corners and edges.
const W = 1.8;
const H = 1.3;
const D = 0.12;

function Magnet({
  tex,
  pointer,
  reduced,
}: {
  tex: THREE.Texture;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  // Fit the magnet to the visible area with margin for the tilt, so it is
  // always fully on screen and centred, from phones to desktop.
  const fit = Math.min(1.25, viewport.width / (W * 1.45), viewport.height / (H * 1.9));

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Same feel as the template: gentle idle sway + tilt toward the pointer.
    group.current.rotation.y = (reduced ? 0 : Math.sin(t * 0.8) * 0.2) + pointer.current.x * 0.5;
    group.current.rotation.x = -pointer.current.y * 0.35 + (reduced ? 0 : Math.sin(t * 0.6) * 0.04);
    group.current.position.y = reduced ? 0 : Math.sin(t * 1.1) * 0.05;
  });

  return (
    <group ref={group} scale={fit}>
      <mesh castShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#5a2d16" roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Glossy photo front */}
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.22} metalness={0.04} />
      </mesh>
      {/* Brown magnetic back */}
      <mesh position={[0, 0, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#3a1c0d" roughness={0.9} metalness={0.15} />
      </mesh>
    </group>
  );
}

export default function MagnetScene({ image = "/family.avif", active = true }: { image?: string; active?: boolean }) {
  const pointer = useRef({ x: 0, y: 0 });
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    let alive = true;
    loadMagnetTexture(image, W / H)
      .then((t) => alive && setTex(t))
      .catch((err) => console.warn("[magnet] texture load failed", err));
    return () => {
      alive = false;
    };
  }, [image]);

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function onLeave() {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.2, 4.2], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#d9c9ba" />
      <directionalLight position={[2, 5, 4]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
      {tex && <Magnet tex={tex} pointer={pointer} reduced={reduced} />}
      {/* Invisible floor that only shows the soft shadow — no background. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <shadowMaterial opacity={0.16} />
      </mesh>
    </Canvas>
  );
}
