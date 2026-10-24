"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadMagnetTexture } from "@/lib/magnetTexture";

// Real magnet: 90mm x 65mm flat slab with sharp corners and edges.
const W = 1.8;
const H = 1.3;
const D = 0.12;

// Shared drag state between the DOM pointer handlers and the render loop.
type Drag = {
  active: boolean;
  lastX: number;
  lastY: number;
  velX: number; // rad/frame around world Y (horizontal drag)
  velY: number; // rad/frame around world X (vertical drag)
  touched: boolean; // user has interacted at least once
  reset: boolean; // ease back to front-facing
};

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const tmpQ = new THREE.Quaternion();
const IDENTITY = new THREE.Quaternion();

function spin(q: THREE.Quaternion, aroundY: number, aroundX: number) {
  // Rotate about WORLD axes so a drag always turns the magnet the way the
  // finger moves, even after it has been flipped upside down.
  q.premultiply(tmpQ.setFromAxisAngle(AXIS_Y, aroundY));
  q.premultiply(tmpQ.setFromAxisAngle(AXIS_X, aroundX));
}

function Magnet({
  tex,
  drag,
  pending,
  reduced,
}: {
  tex: THREE.Texture;
  drag: React.RefObject<Drag>;
  pending: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  // Fit the magnet to the visible area (it can be turned to any angle).
  const fit = Math.min(1.25, viewport.width / (W * 1.35), viewport.height / (W * 1.15));

  useFrame((state) => {
    const g = group.current;
    const d = drag.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Apply queued drag movement: a full drag across the canvas ≈ one turn.
    const p = pending.current;
    if (p.x !== 0 || p.y !== 0) {
      const k = (Math.PI * 2) / Math.max(size.width, 1);
      const ay = p.x * k;
      const ax = p.y * k;
      spin(g.quaternion, ay, ax);
      d.velX = ay; // remembered for the release flick
      d.velY = ax;
      p.x = 0;
      p.y = 0;
    } else if (d.active) {
      // Finger held still: no flick on release.
      d.velX *= 0.5;
      d.velY *= 0.5;
    }

    if (d.reset) {
      g.quaternion.slerp(IDENTITY, 0.12);
      if (g.quaternion.angleTo(IDENTITY) < 0.01) {
        g.quaternion.identity();
        d.reset = false;
      }
    } else if (!d.touched) {
      // Before the first touch: gentle idle sway hints that it can be turned.
      if (!reduced) {
        g.quaternion.setFromEuler(new THREE.Euler(Math.sin(t * 0.6) * 0.08, Math.sin(t * 0.8) * 0.35, 0));
      }
    } else if (!d.active) {
      // After release: keep spinning with the flick's momentum, then settle.
      spin(g.quaternion, d.velX, d.velY);
      d.velX *= 0.95;
      d.velY *= 0.95;
    }
    g.position.y = reduced || d.active ? 0 : Math.sin(t * 1.1) * 0.04;
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

export default function MagnetScene({
  image = "/family.avif",
  active = true,
  className = "",
}: {
  image?: string;
  active?: boolean;
  className?: string;
}) {
  const drag = useRef<Drag>({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0, touched: false, reset: false });
  const pending = useRef({ x: 0, y: 0 }); // drag delta not yet applied
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

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    d.active = true;
    d.touched = true;
    d.reset = false;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.velX = d.velY = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    pending.current.x += dx;
    pending.current.y += dy;
  }
  function onUp(e: ReactPointerEvent<HTMLDivElement>) {
    drag.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function resetView() {
    drag.current.velX = drag.current.velY = 0;
    drag.current.reset = true;
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={resetView}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          frameloop={active ? "always" : "never"}
          camera={{ position: [0, 0.2, 4.2], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#d9c9ba" />
          <directionalLight position={[2, 5, 4]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
          {/* Back light so the magnetic side is visible when flipped. */}
          <directionalLight position={[-2, -3, -5]} intensity={0.5} color="#e8cf8f" />
          {tex && <Magnet tex={tex} drag={drag} pending={pending} reduced={reduced} />}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <shadowMaterial opacity={0.18} />
          </mesh>
        </Canvas>
      </div>

      <button
        type="button"
        onClick={resetView}
        className="absolute bottom-2 right-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-[11px] font-medium text-muted transition-colors hover:text-charcoal"
      >
        Reset view
      </button>
    </div>
  );
}
