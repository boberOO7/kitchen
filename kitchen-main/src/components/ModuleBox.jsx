// components/ModuleBox.jsx
import React from "react";
import FacadeMat from "./FacadeMat";
import DoorPanel from "./DoorPanel";
import { TOP_THICK, CUT_W, CUT_D } from "../data/constants";

function lighten(hex, k = 0.12) {
  if (!hex?.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) return hex || "#e9ecef";
  const h = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const n = parseInt(h.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * k);
  g = Math.round(g + (255 - g) * k);
  b = Math.round(b + (255 - b) * k);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function ModuleBox({
  posX,                 // лівий край модуля у координатах ВСЬОГО НИЖНЬОГО РЯДУ
  module,
  facadeValue,
  finish,
  matKey,
  rowW,                 // ширина всього нижнього ряду (для суцільної текстури)
  onStartDrag,
  carcassHex = "#e9ecef",
}) {
  const T = 0.018;     // товщина боковин/полиць ~18 мм
  const BACK = 0.006;  // задня ДВП
  const RAIL = 0.06;   // верхні рейки замість "стелі"
  const backHex = lighten(carcassHex, 0.18);

  return (
    <group position={[posX + module.width / 2, module.height / 2, 0]} onPointerDown={onStartDrag}>
      {/* Каркас */}
      <group>
        <mesh castShadow receiveShadow position={[-module.width/2 + T/2, 0, 0]}>
          <boxGeometry args={[T, module.height, module.depth]} />
          <meshStandardMaterial color={carcassHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
        <mesh castShadow receiveShadow position={[ module.width/2 - T/2, 0, 0]}>
          <boxGeometry args={[T, module.height, module.depth]} />
          <meshStandardMaterial color={carcassHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -module.height/2 + T/2, 0]}>
          <boxGeometry args={[module.width - 2*T, T, module.depth]} />
          <meshStandardMaterial color={carcassHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
        <mesh receiveShadow position={[0, 0, -module.depth/2 + BACK/2]}>
          <boxGeometry args={[module.width - 2*T, module.height - T, BACK]} />
          <meshStandardMaterial color={backHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
        <mesh castShadow receiveShadow position={[0,  module.height/2 - RAIL/2,  module.depth/2 - T/2]}>
          <boxGeometry args={[module.width - 2*T, RAIL, T]} />
          <meshStandardMaterial color={carcassHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
        <mesh castShadow receiveShadow position={[0,  module.height/2 - RAIL/2, -module.depth/2 + T/2]}>
          <boxGeometry args={[module.width - 2*T, RAIL, T]} />
          <meshStandardMaterial color={carcassHex} roughness={0.85} metalness={0.02} envMapIntensity={0.25} />
        </mesh>
      </group>

      {/* Фасади: «шкура» на весь нижній ряд */}
      {(() => {
        const DOOR_T = 0.018;
        const REVEAL = 0.002;
        const GAP    = 0.003;
        const z      = module.depth/2 + DOOR_T/2 + 0.001;

        // доступна висота над цоколем
        const availH = module.height - 0.12 - 2*REVEAL;
        const baseY  = -module.height/2 + 0.12 + REVEAL; // локальний низ фасадів
        const innerW = module.width - 2*REVEAL;

        // «шкура» нижнього ряду по Y: 0 .. availH
        const SHEET_H = availH;

        const fronts = [];

        // прямокутник вирізу зі «шкури»
        const rectFor = (cx, h, cy, w) => {
          const centerX = (posX + module.width/2) + cx; // у координатах усього ряду
          const left    = centerX - w/2;                // x=0 — лівий край ряду
          const bottom  = cy - h/2;                     // y=0 — низ фасадів у ряду
          return { x: left, y: bottom, w, h };
        };

        // дверка (відкривна) — DoorPanel
        const pushDoor = (key, cx, h, cy, w, hinge) => {
          const r = rectFor(cx, h, cy, w);
          fronts.push(
            <DoorPanel
              key={`door-${key}`}
              center={[cx, baseY + cy]}      // у локальних координатах модуля
              size={[w, h]}
              z={z}
              hinge={hinge}                   // "left" або "right"
              thickness={DOOR_T}
              finish={finish}
              facadeValue={facadeValue}
              matKey={`${matKey}:L:${r.x.toFixed(3)}:${r.y.toFixed(3)}:${r.w.toFixed(3)}:${r.h.toFixed(3)}`}
              sheetRect={r}
              sheetW={rowW}
              sheetH={SHEET_H}
            />
          );
        };

        // шухляда (не відкривається як дверка) — глуха панель
        const pushDrawerPanel = (key, cx, h, cy, w = innerW) => {
          const r = rectFor(cx, h, cy, w);
          fronts.push(
            <mesh key={`dr-${key}`} position={[cx, baseY + cy, z]} castShadow>
              <boxGeometry args={[w, h, DOOR_T]} />
              <FacadeMat
                value={facadeValue}
                finish={finish}
                matKey={`${matKey}:L:${r.x.toFixed(3)}:${r.y.toFixed(3)}:${r.w.toFixed(3)}:${r.h.toFixed(3)}`}
                sheetRect={r}
                sheetW={rowW}
                sheetH={SHEET_H}
              />
            </mesh>
          );
          // ручка
          fronts.push(
            <mesh key={`hdl-${key}`} position={[cx, baseY + cy + h/2 - 0.08, z + DOOR_T/2 + 0.01]}>
              <boxGeometry args={[0.12, 0.02, 0.02]} />
              <meshStandardMaterial color="#777" metalness={0.8} roughness={0.3} />
            </mesh>
          );
        };

        // ХЕЛПЕРИ РОЗКЛАДКИ
        const twoDoorsFullHeight = () => {
          const w = (innerW - GAP) / 2;
          const cxL = -(GAP/2 + w/2);
          const cxR = +(GAP/2 + w/2);
          const cy  = availH/2;
          pushDoor("L", cxL, availH, cy, w, "left");
          pushDoor("R", cxR, availH, cy, w, "right");
        };

        const oneDoorFull = () => {
          // для одиночної — зробимо петлю зліва
          pushDoor("one", 0, availH, availH/2, innerW, "left");
        };

        const threeDrawers = () => {
          const hGap2 = GAP * 2;
          const hEach = (availH - hGap2) / 3;
          const cy1 = hEach/2;
          const cy2 = hEach + GAP + hEach/2;
          const cy3 = hEach*2 + GAP*2 + hEach/2;
          pushDrawerPanel("d1", 0, hEach, cy1, innerW);
          pushDrawerPanel("d2", 0, hEach, cy2, innerW);
          pushDrawerPanel("d3", 0, hEach, cy3, innerW);
        };

        // Вибір розкладки
        if (module.id === "drawer40") {
          threeDrawers();
        } else if (module.id === "dish60" || module.role === "hob") {
          oneDoorFull();              // суцільна панель (відкривна як дверка)
        } else if (module.role === "sink") {
          twoDoorsFullHeight();       // зазвичай 2 дверки
        } else {
          oneDoorFull();              // вузькі — одна дверка
        }

        return <>{fronts}</>;
      })()}

      {/* Цоколь */}
      <mesh position={[0, -module.height / 2 + 0.06, 0.28]}>
        <boxGeometry args={[module.width, 0.12, 0.05]} />
        <meshStandardMaterial color="#b9b9b9" roughness={0.6} />
      </mesh>

      {/* Маркер варильної */}
      {module.role === "hob" && (
        <mesh position={[0, module.height / 2 + 0.04 + 0.005, 0]}>
          <boxGeometry args={[0.55, 0.01, 0.55]} />
          <meshStandardMaterial color="#1b1b1b" metalness={0.2} roughness={0.6} />
        </mesh>
      )}

      {/* Чаша мийки */}
      {module.role === "sink" && (() => {
        const OVERLAP = 0.02;
        const BOWL_W  = CUT_W + OVERLAP;
        const BOWL_D  = CUT_D + OVERLAP;
        const BOWL_H  = 0.15;

        const WALL_T   = 0.012;
        const BOTTOM_T = 0.006;
        const EPS      = 0.003;

        const localY = (0.9 + TOP_THICK - EPS - BOWL_H / 2) - (module.height / 2);
        const hx = BOWL_W / 2, hz = BOWL_D / 2, hy = BOWL_H / 2;

        return (
          <group key={`sink-${BOWL_W}-${BOWL_H}-${BOWL_D}`} position={[0, localY, 0]} castShadow receiveShadow>
            <mesh position={[0, -hy + BOTTOM_T/2, 0]}>
              <boxGeometry args={[BOWL_W - 2*WALL_T, BOTTOM_T, BOWL_D - 2*WALL_T]} />
              <meshStandardMaterial color="#cfd3d6" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[-hx + WALL_T/2, -(BOTTOM_T/2), 0]}>
              <boxGeometry args={[WALL_T, BOWL_H - BOTTOM_T, BOWL_D]} />
              <meshStandardMaterial color="#cfd3d6" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[ hx - WALL_T/2, -(BOTTOM_T/2), 0]}>
              <boxGeometry args={[WALL_T, BOWL_H - BOTTOM_T, BOWL_D]} />
              <meshStandardMaterial color="#cfd3d6" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[0, -(BOTTOM_T/2),  hz - WALL_T/2]}>
              <boxGeometry args={[BOWL_W - 2*WALL_T, BOWL_H - BOTTOM_T, WALL_T]} />
              <meshStandardMaterial color="#cfd3d6" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[0, -(BOTTOM_T/2), -hz + WALL_T/2]}>
              <boxGeometry args={[BOWL_W - 2*WALL_T, BOWL_H - BOTTOM_T, WALL_T]} />
              <meshStandardMaterial color="#cfd3d6" metalness={0.2} roughness={0.6} />
            </mesh>
            <mesh position={[0.12, -hy + BOTTOM_T + 0.01, 0.05]}>
              <cylinderGeometry args={[0.02, 0.02, 0.01, 24]} />
              <meshStandardMaterial color="#aeb4b7" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        );
      })()}
    </group>
  );
}
