"use client";

import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import SwatchPicker from "@/components/UI/SwatchPicker";
import AccordionSection from "@/components/UI/AccordionSection";
import DesignerKitchen from "@/components/DesignerKitchen";
import { MODEL_BY_FACADE } from "@/data/constants";

const FACADE_SETS = [
  { id: "wood", label: "Дуб · глянець", value: { base: "/assets/textures/wood_d.jpg" } },
  { id: "graphite", label: "Дуб · сірий", value: { base: "/assets/textures/wood_r1.jpg" } },
  { id: "white", label: "Білий · мат", value: { base: "/assets/textures/white_d.jpg" } },
];

const TOP_SETS = [
  { id: "quartz_white", label: "Білий кварц", value: "#efefef" },
  { id: "dark_slate", label: "Темний сланець", value: "#222629" },
];

const CARCASS_SETS = [
  { id: "carc_white", label: "Білий", value: "#e9ecef" },
  { id: "carc_grey", label: "Світло-сірий", value: "#dcdfe3" },
  { id: "carc_graph", label: "Графіт", value: "#3c4043" },
];

const MODEL_SCALE = [1, 1, 1];
const MODEL_POS = [1.25, 0, 0];

export default function KitchenConfigurator({ mode = "embedded" }) {
  const [openId, setOpenId] = useState("facade");

  const [facadeId, setFacadeId] = useState(FACADE_SETS[1].id);
  const modelUrl = MODEL_BY_FACADE[facadeId];
  const [topId, setTopId] = useState(TOP_SETS[0].id);
  const [carcassId, setCarcassId] = useState(CARCASS_SETS[0].id);

  const facadeLabel = useMemo(() => FACADE_SETS.find((x) => x.id === facadeId)?.label ?? "", [facadeId]);
  const topLabel = useMemo(() => TOP_SETS.find((x) => x.id === topId)?.label ?? "", [topId]);
  const carcassLabel = useMemo(() => CARCASS_SETS.find((x) => x.id === carcassId)?.label ?? "", [carcassId]);

  const isFullscreen = mode === "fullscreen";

  return (
    <div className={`flex h-full ${isFullscreen ? "flex-row" : "flex-col gap-4 lg:flex-row"}`}>
      {/* ─────────────────────────────────────────────────────────────────────
          SIDEBAR PANEL
          ───────────────────────────────────────────────────────────────────── */}
      <aside
        className={`shrink-0 overflow-y-auto border-[var(--sky-border)] bg-[var(--sky-surface)] ${
          isFullscreen
            ? "w-[320px] border-r"
            : "w-full border lg:w-[340px]"
        }`}
        style={{ borderRadius: isFullscreen ? 0 : 3 }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-[var(--sky-muted2)]">
              <span className="h-[1px] w-4 bg-current opacity-50" />
              МАТЕРІАЛИ
            </div>
            <div className="mt-2 text-base font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
              Налаштуйте вигляд
            </div>
          </div>

          {/* Accordions */}
          <AccordionSection
            id="facade"
            title="Фасад"
            openId={openId}
            setOpenId={setOpenId}
            summary={facadeLabel}
          >
            <SwatchPicker options={FACADE_SETS} value={facadeId} onChange={setFacadeId} />
          </AccordionSection>

          <AccordionSection
            id="top"
            title="Стільниця"
            openId={openId}
            setOpenId={setOpenId}
            summary={topLabel}
          >
            <SwatchPicker options={TOP_SETS} value={topId} onChange={setTopId} />
          </AccordionSection>

          <AccordionSection
            id="carcass"
            title="Корпус"
            openId={openId}
            setOpenId={setOpenId}
            summary={carcassLabel}
          >
            <SwatchPicker options={CARCASS_SETS} value={carcassId} onChange={setCarcassId} />
          </AccordionSection>

          {/* Price estimate */}
          <div
            className="mt-6 border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] p-4"
            style={{ borderRadius: 2 }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--sky-muted)]">
              <span>Попередня оцінка</span>
              <span className="text-[var(--sky-muted2)]">без монтажу</span>
            </div>
            <div className="mt-2 text-xl font-medium tracking-tight text-[var(--sky-fg)]">
              від €5 900
            </div>
            <button
              type="button"
              className="mt-4 w-full bg-[var(--sky-accent)] py-2.5 text-xs font-medium tracking-[0.04em] text-[var(--sky-accent-fg)] transition hover:opacity-90"
              style={{ borderRadius: 2 }}
            >
              Замовити розрахунок
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────────
          3D VIEWPORT
          ───────────────────────────────────────────────────────────────────── */}
      <div
        className={`relative flex-1 overflow-hidden bg-[var(--sky-bg-alt)] ${
          isFullscreen ? "" : "min-h-[400px] border border-[var(--sky-border)] lg:min-h-0"
        }`}
        style={{ borderRadius: isFullscreen ? 0 : 3 }}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          shadows
          camera={{ position: [3.2, 2.2, 4.0], fov: 32 }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
        >
          <color attach="background" args={["#f4f5f6"]} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.1}
            castShadow
            shadow-normalBias={0.02}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Environment preset="apartment" />

          <OrbitControls
            makeDefault
            minPolarAngle={0.2}
            maxPolarAngle={1.65}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={8}
          />

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#f0f1f3" roughness={0.92} metalness={0} />
          </mesh>

          {/* Model with auto-fit */}
          <Bounds fit clip observe margin={1.15}>
            <group position={MODEL_POS} scale={MODEL_SCALE}>
              <DesignerKitchen url={modelUrl} debug={false} />
            </group>
          </Bounds>

          <ContactShadows position={[0, 0.001, 0]} opacity={0.2} width={10} height={10} blur={1.6} far={1.8} />
        </Canvas>

        {/* Hints overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between text-[10px] tracking-[0.06em] text-[var(--sky-muted2)]">
          <span>Крутіть мишкою для огляду</span>
          <span>Клацніть на дверцята щоб відкрити</span>
        </div>
      </div>
    </div>
  );
}
