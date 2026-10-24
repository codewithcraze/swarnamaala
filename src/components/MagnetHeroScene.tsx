"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadMagnetTexture } from "@/lib/magnetTexture";

// Flat magnet slab — sharp corners and edges, no rounding or bevel.
const D = 0.1;
type Shape = "rect" | "square";
// rect = 90mm x 65mm; square sized to sit nicely beside it.
const SIZE: Record<Shape, [number, number]> = { rect: [2.9, 2.1], square: [2.3, 2.3] };

type Placement = { image: string; shape: Shape; x: number; y: number; rot: number; delay: number };

// Six large magnets: 2 columns x 3 rows, shapes alternating so rectangles and
// squares interlock; the right column sits slightly lower for a hand-placed
// look. Centered on the origin so the field can be scaled to any screen size.
const PLACEMENTS: Placement[] = [
  { image: "/family.avif", shape: "rect", x: -1.62, y: 2.45, rot: -0.07, delay: 0 },
  { image: "/love.avif", shape: "square", x: 1.62, y: 2.3, rot: 0.06, delay: 0.14 },
  { image: "/birthday.avif", shape: "square", x: -1.62, y: 0, rot: 0.05, delay: 0.28 },
  { image: "/travel.avif", shape: "rect", x: 1.62, y: -0.15, rot: -0.08, delay: 0.42 },
  { image: "/travel.avif", shape: "rect", x: -1.62, y: -2.45, rot: 0.07, delay: 0.56 },
  { image: "/family.avif", shape: "square", x: 1.62, y: -2.6, rot: -0.05, delay: 0.7 },
];
// Size of the whole layout (plus a little breathing room), used to fit it to the canvas.
const FIELD_W = 6.5;
const FIELD_H = 7.6;

// Overshoot-then-settle easing, so each magnet "snaps" onto the fridge.
function easeOutBack(p: number) {
  const c1 = 1.3;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

function Magnet({
  p,
  tex,
  start,
  reduced,
}: {
  p: Placement;
  tex: THREE.Texture;
  start: React.RefObject<number | null>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const anim = useRef({ lift: 0, rx: 0, ry: 0 });
  const [w, h] = SIZE[p.shape];

  useFrame((state) => {
    if (!group.current || start.current === null) return;
    const t = state.clock.elapsedTime - start.current;
    const raw = reduced ? 1 : Math.min(Math.max((t - p.delay) / 0.55, 0), 1);
    const e = easeOutBack(raw);

    // Hover: lift off the fridge and tilt toward the cursor (eased).
    const u = anim.current;
    const on = hovered.current;
    u.lift += ((on ? 0.5 : 0) - u.lift) * 0.14;
    u.rx += ((on ? -state.pointer.y * 0.35 : 0) - u.rx) * 0.14;
    u.ry += ((on ? state.pointer.x * 0.35 : 0) - u.ry) * 0.14;

    // Fly in from in front of the camera and stick at z≈0.
    group.current.position.set(p.x, p.y, 0.1 + (1 - e) * 7 + u.lift);
    group.current.rotation.set(u.rx, u.ry, p.rot + (1 - e) * (p.rot > 0 ? 0.6 : -0.6));
    group.current.scale.setScalar(1 + (1 - e) * 0.25);
    group.current.visible = raw > 0;
  });

  return (
    <group ref={group} visible={false}>
      <mesh
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = true;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={[w, h, D]} />
        <meshStandardMaterial color="#5a2d16" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, D / 2 + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.25} metalness={0.04} />
      </mesh>
    </group>
  );
}

function Field({ textures, reduced }: { textures: THREE.Texture[]; reduced: boolean }) {
  const start = useRef<number | null>(null);
  const { viewport, camera } = useThree();
  // Scale the layout so it always fits the canvas (mobile through desktop).
  const scale = Math.min(viewport.width / FIELD_W, viewport.height / FIELD_H, 1.3);

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    if (!reduced) {
      // Subtle camera parallax following the pointer, like the template.
      camera.position.x += (state.pointer.x * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (state.pointer.y * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group scale={scale} position={[0, -0.06 * scale, 0]}>
      {/* Invisible shadow catcher: only the magnets' soft shadows show,
          so there is no background or border behind them. */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <shadowMaterial opacity={0.14} />
      </mesh>
      {PLACEMENTS.map((p, i) => (
        <Magnet key={i} p={p} tex={textures[i]} start={start} reduced={reduced} />
      ))}
    </group>
  );
}

export default function MagnetHeroScene({ active }: { active: boolean }) {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    let alive = true;
    Promise.all(
      PLACEMENTS.map((p) => {
        const [w, h] = SIZE[p.shape];
        return loadMagnetTexture(p.image, w / h);
      })
    )
      .then((t) => alive && setTextures(t))
      .catch((err) => console.warn("[magnets] texture load failed", err));
    return () => {
      alive = false;
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 8.5], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight intensity={1.0} color="#ffffff" groundColor="#d9c9ba" />
      <directionalLight
        position={[-4, 6, 10]}
        intensity={0.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {textures && <Field textures={textures} reduced={reduced} />}
    </Canvas>
  );
}
