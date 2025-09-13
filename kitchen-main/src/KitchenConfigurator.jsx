import { Perf } from 'r3f-perf';
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

import "./kitchen.css";

import {
  MODULE_CATALOG, FACADE_OPTIONS, COUNTERTOPS,
  COUNTERTOP_SWATCHES, CARCASS_OPTIONS, CUT_W, CUT_D
} from "./data/constants";
import SwatchPicker from "./components/UI/SwatchPicker";
import AccordionSection from "./components/UI/AccordionSection";
import MetricsHUD from "./components/dev/MetricsHUD";
import ExposeThree from "./components/dev/ExposeThree";

import DesignerKitchen from "./components/DesignerKitchen";

/* ---------- helpers ---------- */

// автодоливки
function computePlan(modules, targetLength) {
  const fixedWidth = modules.reduce((s, m) => s + (m.isFiller ? 0 : m.width), 0);
  const delta = Math.max(0, targetLength - fixedWidth);
  const maxChunk = 0.08;
  const fillerCount = Math.ceil(delta / maxChunk);
  const fillers = [];
  if (delta > 0) {
    for (let i = 0; i < fillerCount; i++) {
      const remaining = delta - i * maxChunk;
      const w = Math.min(maxChunk, remaining);
      fillers.push({
        ...MODULE_CATALOG.find(x => x.id === "filler"),
        width: w,
        name: `Filler ${Math.round(w * 100)}cm`,
      });
    }
  }
  const lineup = [...modules.filter(m => !m.isFiller), ...fillers];
  const total = lineup.reduce((s, m) => s + m.width, 0);
  return { lineup, total, delta };
}

// блок ціни
function Price({ lineup, facadeFinish, countertop, hasUpper, hasHood }) {
  const base = lineup.reduce((s, m) => s + (m.price ?? 0), 0);
  const finishK = facadeFinish === "gloss" ? 1.12 : 1.0;
  const topK = countertop?.priceMultiplier ?? 1.0;
  const upperCost = hasUpper ? Math.round(base * 0.45) : 0;
  const hoodCost = hasHood ? 280 : 0;
  const subtotal = Math.round((base + upperCost + hoodCost) * finishK * topK);
  return (
    <div className="price">
      <div><span>Lower modules:</span><b>€{base}</b></div>
      {hasUpper && <div><span>Upper modules (est):</span><b>€{upperCost}</b></div>}
      {hasHood && <div><span>Range hood:</span><b>€{hoodCost}</b></div>}
      <div><span>Finish factor:</span><b>{finishK.toFixed(2)}</b></div>
      <div><span>Countertop factor:</span><b>{topK.toFixed(2)}</b></div>
      <hr />
      <div className="total"><span>Estimated total:</span><b>€{subtotal}</b></div>
    </div>
  );
}

/* ---------- main component ---------- */

export default function KitchenConfigurator() {
  // акордеон: одночасно відкритий один розділ
  const [openId, setOpenId] = useState("carcass");
  // модель кухні дизайнера
  const [useDesignerModel, setUseDesignerModel] = useState(false);

  // carcass
  const [carcassId, setCarcassId] = useState("carc_white");
  const carcassHex = useMemo(
    () => CARCASS_OPTIONS.find(o => o.id === carcassId)?.value ?? "#e9ecef",
    [carcassId]
  );
  const carcassLabel = useMemo(
    () => CARCASS_OPTIONS.find(o => o.id === carcassId)?.label ?? "",
    [carcassId]
  );

  // facade
  const [facadeId, setFacadeId] = useState("graphite");
  const [finish, setFinish] = useState("matte");
  const facadeValue = useMemo(
    () => FACADE_OPTIONS.find(o => o.id === facadeId)?.value ?? "#ffffff",
    [facadeId]
  );
  const facadeLabel = useMemo(
    () => FACADE_OPTIONS.find(o => o.id === facadeId)?.label ?? "",
    [facadeId]
  );
  const facadeMatKey = `facade:${facadeId}:${finish}`;

  // countertop
  const [countertopId, setCountertopId] = useState("white");
  const countertop = useMemo(
    () => COUNTERTOPS.find(c => c.id === countertopId),
    [countertopId]
  );
  const topLabel = useMemo(
    () => COUNTERTOPS.find(c => c.id === countertopId)?.name ?? "",
    [countertopId]
  );

  // модулі/довжина/видимість
  const [modules, setModules] = useState([
    MODULE_CATALOG[0], // base60
    MODULE_CATALOG[4], // hob60
    MODULE_CATALOG[2], // sink80
  ]);
  const [targetLength, setTargetLength] = useState(2.0);
  const [showUpper, setShowUpper] = useState(true);
  const [showHood, setShowHood] = useState(true);

  const { lineup, total, delta } = useMemo(() => computePlan(modules, targetLength), [modules, targetLength]);

  // позиції нижнього ряду + індекс серед НЕ-філерів (щоб drag не плутався)
  let accX = 0;
  let bIndex = 0;
  const positions = lineup.map(m => {
    const startX = accX; accX += m.width;
    const baseIndex = m.isFiller ? null : bIndex++;
    return { module: m, x: startX, baseIndex };
  });

  // виріз під мийку та центр плити для витяжки
  const sinkEntry  = positions.find(p => p.module.role === "sink");
  const sinkCenter = sinkEntry ? sinkEntry.x + sinkEntry.module.width / 2 : null;
  const hobEntry   = positions.find(p => p.module.role === "hob");
  const hoodCenter = hobEntry ? hobEntry.x + hobEntry.module.width / 2 : total / 2;

  // верхній ряд (дзеркалимо лише нефілери), але X беремо фактичні
  const uppers = positions.filter(p => !p.module.isFiller).map(p => ({ x: p.x, width: p.module.width }));
  const upperX0 = uppers.length ? uppers[0].x : 0;
  const upperX1 = uppers.length ? uppers[uppers.length - 1].x + uppers[uppers.length - 1].width : 0;
  const upperRowW = Math.max(0, upperX1 - upperX0);

  // === drag по Canvas ===
  const [three, setThree] = useState(null);

  return (
    <div className="wrap">
      {/* Панель керування */}
      <div className="panel">
        <h1>Kitchen Configurator</h1>
        <p></p>

        {/* Акордеон: корпус / фасад / стільниця */}
        <AccordionSection
          id="carcass"
          title="Carcass color"
          openId={openId}
          setOpenId={setOpenId}
          summary={carcassLabel}
        >
          <SwatchPicker options={CARCASS_OPTIONS} value={carcassId} onChange={setCarcassId} />
        </AccordionSection>

        <AccordionSection
          id="facade"
          title="Facade finish"
          openId={openId}
          setOpenId={setOpenId}
          summary={`${facadeLabel} • ${finish}`}
        >
          <SwatchPicker options={FACADE_OPTIONS} value={facadeId} onChange={setFacadeId} />

          {/* сегментний перемикач замість “звичайних” радіо */}
          <div className="segmented" style={{ marginTop: 10 }}>
            <label className={finish === "matte" ? "on" : ""}>
              <input type="radio" name="finish" checked={finish === "matte"} onChange={() => setFinish("matte")} />
              <span>Matte</span>
            </label>
            <label className={finish === "gloss" ? "on" : ""}>
              <input type="radio" name="finish" checked={finish === "gloss"} onChange={() => setFinish("gloss")} />
              <span>Gloss</span>
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          id="top"
          title="Countertop"
          openId={openId}
          setOpenId={setOpenId}
          summary={topLabel}
        >
          <SwatchPicker options={COUNTERTOP_SWATCHES} value={countertopId} onChange={setCountertopId} />
        </AccordionSection>

        {/* Ціна */}
        <Price
          lineup={lineup}
          facadeFinish={finish}
          countertop={countertop}
          hasUpper={showUpper}
          hasHood={showHood}
        />
      </div>

      {/* 3D */}
      <div className="viewport">
        <Canvas
          shadows
          camera={{ position: [2.4, 2.0, 3.4], fov: 35 }}
          onCreated={({ gl }) => {
            // three r152+:
            if ('outputColorSpace' in gl) {
              gl.outputColorSpace = THREE.SRGBColorSpace;
            } else {
              // fallback для старіших версій three:
              gl.outputEncoding = THREE.sRGBEncoding;
            }
            // (не обов'язково, але зазвичай приємніше для PBR)
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[2.5, 5, 3]}
            intensity={1.2}
            castShadow
            shadow-normalBias={0.02}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Environment preset="city" />

          {/* Підлога + грід */}
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[Math.max(8, total + 2), Math.max(8, total + 2)]} />
              <meshStandardMaterial color="#fafafa" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
            <gridHelper
              args={[Math.max(8, total + 2), Math.max(8, total + 2) * 2, "#d0d0d0", "#e7e7e7"]}
              position={[0, 0, 0]}
            />
          </group>
          {/* ===== РЕНДЕР ДИЗАЙНЕРСЬКОГО GLB ===== */}
          <DesignerKitchen
            url="/assets/kitchen/Kitchen 3.glb"
            // якщо з Max у см: масштаб нижче
            // scale={[0.01, 0.01, 0.01]}
            scale={[1,1,1]}
            position={[0,0,0]}
          />

          <ContactShadows position={[0, 0, 0]} opacity={0.25} width={8} height={8} blur={1.4} far={1.5} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={1.8} target={[0, 0.95, 0]} />
          <Perf position="top-right" minimal />   {/* FPS, мс/кадр, drawcalls/triangles */}
          <ExposeThree onReady={setThree} />
        </Canvas>
        <MetricsHUD three={three} position="bottom-right" />
      </div>
    </div>
  );
}
