"use client";

import { Suspense, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Real magnet dimensions: 90mm x 65mm, flat. We model it to scale (in cm) as a
// plain rectangular slab with SHARP corners and edges — no rounding, no bevel.
const W = 1.8; // 90mm
const H = 1.3; // 65mm
const D = 0.12; // thin slab

// Pointer position over the stage, shared so the slab tilts toward the cursor.
function Magnet({ image, pointer }: { image: string; pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null);
  const texture = useTexture(image);
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Target tilt from the pointer; gentle idle sway when the cursor is centered.
    const targetY = pointer.current.x * 0.6 + Math.sin(t * 0.5) * 0.08;
    const targetX = -pointer.current.y * 0.4 + Math.sin(t * 0.4) * 0.04;
    // Ease toward the target for a smooth, weighty feel.
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 6);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 6);
    group.current.position.y = Math.sin(t * 1.1) * 0.03;
  });

  return (
    <group ref={group}>
      {/* The slab body — sharp rectangular box (90x65mm). Side faces are the
          brown edge of the magnet. */}
      <mesh castShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#5a2d16" roughness={0.55} metalness={0.08} />
      </mesh>

      {/* Glossy printed photo on the FRONT face */}
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={texture} roughness={0.22} metalness={0.04} />
      </mesh>

      {/* Brown magnetic sheet on the BACK face */}
      <mesh position={[0, 0, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#3a1c0d" roughness={0.9} metalness={0.15} />
      </mesh>
      {/* Magnetic strip detail on the back */}
      <mesh position={[0, 0, -D / 2 - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W * 0.78, H * 0.26]} />
        <meshStandardMaterial color="#1f0f07" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function MagnetScene({ image = "/family.avif" }: { image?: string }) {
  const pointer = useRef({ x: 0, y: 0 });

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    // The Canvas renders into an HTML element, so this is a DOM pointer event.
    // Convert client coords to normalized device coords (-1..1) over the canvas.
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
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 3.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#f4b942" />
      <Suspense fallback={null}>
        <Magnet image={image} pointer={pointer} />
        <Environment preset="apartment" />
      </Suspense>
      <ContactShadows position={[0, -1, 0]} opacity={0.35} scale={5} blur={2.5} far={2.5} color="#3a1c0d" />
    </Canvas>
  );
}
