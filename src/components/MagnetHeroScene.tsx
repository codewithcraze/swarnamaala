"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Flat magnet depth (sharp slab, no rounding).
const D = 0.1;

type Placement = {
  image: string;
  shape: "rect" | "square";
  x: number;
  y: number;
  rot: number; // resting z-rotation (slight casual tilt)
  delay: number;
};

// A loose, hand-placed grid of magnets across the fridge door. Only rectangles
// (90x65mm -> 1.8 x 1.3) and squares are used.
const PLACEMENTS: Placement[] = [
  { image: "/family.avif", shape: "rect", x: -2.4, y: 1.3, rot: -0.1, delay: 0.0 },
  { image: "/love.avif", shape: "square", x: 0.1, y: 1.5, rot: 0.06, delay: 0.15 },
  { image: "/travel.avif", shape: "rect", x: 2.7, y: 1.2, rot: 0.12, delay: 0.3 },
  { image: "/birthday.avif", shape: "square", x: -2.9, y: -0.7, rot: 0.08, delay: 0.45 },
  { image: "/travel.avif", shape: "square", x: -0.5, y: -0.6, rot: -0.1, delay: 0.6 },
  { image: "/family.avif", shape: "rect", x: 2.2, y: -0.8, rot: 0.05, delay: 0.75 },
  { image: "/love.avif", shape: "rect", x: -1.5, y: -2.6, rot: 0.07, delay: 0.9 },
  { image: "/birthday.avif", shape: "square", x: 1.4, y: -2.7, rot: -0.06, delay: 1.05 },
];

// Cubic ease-out-back so magnets slightly overshoot then settle, like a "snap".
function easeOutBack(p: number) {
  const c1 = 1.3;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

function Magnet({ p }: { p: Placement }) {
  const group = useRef<THREE.Group>(null);
  const texture = useTexture(p.image);
  texture.colorSpace = THREE.SRGBColorSpace;

  const [w, h] = p.shape === "rect" ? [1.8, 1.3] : [1.45, 1.45];

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // 0 -> 1 over ~0.6s after this magnet's delay.
    const raw = Math.min(Math.max((t - p.delay) / 0.6, 0), 1);
    const e = easeOutBack(raw);
    // Fly in from toward the camera (z high) to resting z=0, with a little spin.
    group.current.position.set(p.x, p.y, (1 - e) * 6);
    group.current.rotation.set(0, (1 - raw) * 0.8, p.rot + (1 - e) * 0.5);
    const s = 0.9 + raw * 0.1;
    group.current.scale.setScalar(s);
    group.current.visible = raw > 0;
  });

  return (
    <group ref={group} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[w, h, D]} />
        <meshStandardMaterial color="#5a2d16" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.24} metalness={0.04} />
      </mesh>
    </group>
  );
}

function Fridge() {
  return (
    <mesh position={[0, 0, -0.4]} receiveShadow>
      <planeGeometry args={[40, 26]} />
      <meshStandardMaterial color="#f3ece4" roughness={0.5} metalness={0.12} />
    </mesh>
  );
}

export default function MagnetHeroScene() {
  const placements = useMemo(() => PLACEMENTS, []);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <hemisphereLight intensity={0.95} color="#ffffff" groundColor="#d9c9ba" />
      <directionalLight position={[-5, 8, 12]} intensity={0.85} castShadow shadow-mapSize={[2048, 2048]} />
      <Suspense fallback={null}>
        <Fridge />
        {placements.map((p, i) => (
          <Magnet key={i} p={p} />
        ))}
        <Environment preset="apartment" />
      </Suspense>
      <ContactShadows position={[0, -3.6, 0]} opacity={0.25} scale={14} blur={3} far={5} color="#3a1c0d" />
    </Canvas>
  );
}
