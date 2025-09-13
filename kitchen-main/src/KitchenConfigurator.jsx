import { Perf } from 'r3f-perf';
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import * as THREE from "three";

import "./kitchen.css";
import ModuleBox from "./components/ModuleBox";
import UpperCabinet from "./components/UpperCabinet";
import Countertop from "./components/Countertop";
import RangeHood from "./components/RangeHood";
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
  const GROUND = new Plane(new Vector3(0, 1, 0), 0);
  const TMP = new Vector3();
  const groupRef = useRef();
  const [drag, setDrag] = useState(null);
  const GRID = 0.1;
  const dragIndex = useRef(null); // для HTML DnD у списку

  const worldToLocalX = (e) => {
    const wp = e.point ?? e.ray?.intersectPlane(GROUND, TMP);
    if (!wp || !groupRef.current) return null;
    const p = wp.clone(); groupRef.current.worldToLocal(p); return p.x;
  };
  const snap = (x) => Math.round(x / GRID) * GRID;
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

  const onStartDrag = (e, iBase, module) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (module.isFiller || iBase == null) return;

    const xLocal = worldToLocalX(e); if (xLocal == null) return;

    const basePositions = positions.filter(p => !p.module.isFiller);
    const left   = basePositions[iBase].x;
    const center = left + module.width / 2;
    const offset = xLocal - center;

    setDrag({ i: iBase, width: module.width, offset, x: left });
    document.body.style.cursor = "grabbing";
  };

  const onMove = (e) => {
    if (!drag) return;
    const xLocal = worldToLocalX(e); if (xLocal == null) return;
    let x = xLocal - drag.offset - drag.width / 2;
    x = clamp(x, -drag.width / 2, Math.max(0, total - drag.width / 2));
    setDrag((d) => ({ ...d, x: snap(x) }));
  };

  const onEnd = (e) => {
    if (!drag) return;
    e?.stopPropagation?.();
    e?.currentTarget?.releasePointerCapture?.(e.pointerId);

    const basePositions = positions.filter(p => !p.module.isFiller);
    const leftFallback = basePositions[drag.i]?.x ?? 0;
    const left = Number.isFinite(drag.x) ? drag.x : leftFallback;
    const draggedCenter = left + drag.width / 2;

    const centers = basePositions.map((p, idx) =>
      idx === drag.i ? draggedCenter : p.x + p.module.width / 2
    );
    let rawIndex = centers.filter(c => c < draggedCenter).length;
    let insertIndex = rawIndex;
    if (insertIndex > drag.i) insertIndex -= 1;
    insertIndex = Math.max(0, Math.min(insertIndex, centers.length - 1));

    setModules(prev => {
      const base = prev.filter(m => !m.isFiller);
      const arr = base.slice();
      const [item] = arr.splice(drag.i, 1);
      arr.splice(insertIndex, 0, item);
      return arr; // fillers перерахує computePlan
    });

    setDrag(null);
    document.body.style.cursor = "auto";
  };

  useEffect(() => {
    if (!drag) return;
    const handler = (ev) => onEnd(ev);
    window.addEventListener("pointerup", handler);
    window.addEventListener("pointercancel", handler);
    return () => {
      window.removeEventListener("pointerup", handler);
      window.removeEventListener("pointercancel", handler);
    };
  }, [drag]);

  // UI helpers
  const addModule = (id) => {
    const mod = MODULE_CATALOG.find(m => m.id === id);
    if (!mod) return;
    setModules(prev => [...prev, mod]);
  };
  const removeLast = () => setModules(prev => prev.slice(0, -1));
  const reset = () => setModules([MODULE_CATALOG[0], MODULE_CATALOG[4], MODULE_CATALOG[2]]);

  // HTML5 DnD у списку (повернули)
  function onDragStartList(e, index) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOverList(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDropList(e, index) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setModules(prev => {
      const baseOnly = prev.filter(m => !m.isFiller);
      const arr = baseOnly.slice();
      const [item] = arr.splice(from, 1);
      arr.splice(index, 0, item);
      return arr; // fillers перерахуються в computePlan
    });
    dragIndex.current = null;
  }

  const [three, setThree] = useState(null);

  return (
    <div className="wrap">
      {/* Панель керування */}
      <div className="panel">
        <h1>Kitchen Configurator</h1>
        <p className="muted">Нижні модулі + верхні шафи, витяжка, DnD; суцільна текстура по рядах.</p>

        <div className="row">
          <label>Target length: <b>{targetLength.toFixed(2)} m</b></label>
          <input
            type="range"
            min="2"
            max="5"
            step="0.01"
            value={targetLength}
            onChange={e => setTargetLength(parseFloat(e.target.value))}
          />
          <div className="hint">
            Current lineup: <b>{total.toFixed(2)} m</b>{" "}
            {delta > 0 ? `( +${delta.toFixed(2)} m via fillers )` : `(fits)`}
          </div>
        </div>

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

        {/* Тумблери */}
        <div className="row two" style={{marginTop:8}}>
          <label className="toggle-switch">
            <input type="checkbox" checked={useDesignerModel} onChange={e=>setUseDesignerModel(e.target.checked)} />
            <span className="ts-slider" />
            <span className="ts-label">Use designer GLB</span>
          </label>
        </div>
        <div className="row two" style={{ marginTop: 12 }}>
          <label className="toggle-switch">
            <input type="checkbox" checked={showUpper} onChange={e => setShowUpper(e.target.checked)} />
            <span className="ts-slider" />
            <span className="ts-label">Show upper cabinets</span>
          </label>
          <label className="toggle-switch">
            <input type="checkbox" checked={showHood} onChange={e => setShowHood(e.target.checked)} />
            <span className="ts-slider" />
            <span className="ts-label">Show range hood</span>
          </label>
        </div>

        {/* Бібліотека модулів */}
        <div className="row">
          <label>Add module</label>
          <div className="mods">
            {MODULE_CATALOG.filter(m => !m.isFiller).map(m => (
              <button key={m.id} onClick={() => addModule(m.id)}>{m.name}</button>
            ))}
          </div>
          <div className="mods">
            <button onClick={removeLast}>Remove last</button>
            <button onClick={reset}>Reset</button>
          </div>
        </div>

        {/* DnD список для перестановки */}
        <div className="row">
          <label>Reorder (drag & drop)</label>
          <ul className="dnd">
            {modules.filter(m => !m.isFiller).map((m, i) => (
              <li
                key={`${m.id}-${i}`}
                draggable
                onDragStart={(e)=>onDragStartList(e,i)}
                onDragOver={onDragOverList}
                onDrop={(e)=>onDropList(e,i)}
              >
                <span className="tag">{m.width.toFixed(2)}m</span> {m.name}
              </li>
            ))}
          </ul>
          <div className="hint">Перетягни елементи у списку, щоб змінити порядок модулів нижнього ряду.</div>
        </div>

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

          {useDesignerModel ? (
            // ===== РЕНДЕР ДИЗАЙНЕРСЬКОГО GLB =====
            <DesignerKitchen
              url="/assets/kitchen/Kitchen 3.glb"
              // якщо з Max у см: масштаб нижче
              // scale={[0.01, 0.01, 0.01]}
              scale={[1,1,1]}
              position={[0,0,0]}
            />
          ) : (
            // ===== СТАРА ПРОЦЕДУРНА КУХНЯ =====
            <group
              ref={groupRef}
              position={[-total / 2, 0, 0]}
              onPointerMove={onMove}
              onPointerUp={onEnd}
              onPointerCancel={onEnd}
            >
              {positions.map(({ module, x, baseIndex }, i) => (
                <ModuleBox
                  key={`${module.id}-${i}`}
                  posX={drag && baseIndex !== null && drag.i === baseIndex ? drag.x : x}
                  module={module}
                  facadeValue={facadeValue}
                  matKey={facadeMatKey}
                  finish={finish}
                  rowW={total}
                  onStartDrag={(e) => onStartDrag(e, baseIndex, module)}
                  carcassHex={carcassHex}
                />
              ))}

              <Countertop
                length={total}
                color={countertop?.hex}
                cutout={sinkCenter ? { x: sinkCenter, w: CUT_W, d: CUT_D } : null}
              />

              {showUpper && uppers.map((u, idx) => (
                <UpperCabinet
                  key={`u-${idx}-${u.x.toFixed(3)}`}
                  posX={u.x}
                  width={u.width}
                  facadeValue={facadeValue}
                  matKey={facadeMatKey}
                  finish={finish}
                  isFirst={idx === 0}
                  isLast={idx === uppers.length - 1}
                  rowX0={upperX0}
                  rowW={upperRowW}
                  carcassHex={carcassHex}
                />
              ))}

              {showHood && <RangeHood xCenter={hoodCenter} width={0.6} />}
            </group>
          )}

          <ContactShadows position={[0, 0, 0]} opacity={0.25} width={8} height={8} blur={1.4} far={1.5} />
          <OrbitControls makeDefault enabled={!drag} minPolarAngle={0} maxPolarAngle={1.8} target={[0, 0.95, 0]} />
          <Perf position="top-right" minimal />   {/* FPS, мс/кадр, drawcalls/triangles */}
          <ExposeThree onReady={setThree} />
        </Canvas>
        <MetricsHUD three={three} position="bottom-right" />
      </div>
    </div>
  );
}
