// components/UpperCabinet.jsx
import React from "react";
import DoorPanel from "./DoorPanel";
import BiFoldLiftDoor from "./BiFoldLiftDoor";
import { UPPER_PRESET } from "../data/constants";

function lighten(hex, k = 0.12) {
  try {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * k);
    g = Math.round(g + (255 - g) * k);
    b = Math.round(b + (255 - b) * k);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch { return hex; }
}

export default function UpperCabinet({
  posX,                // лівий край секції у координатах УСЬОГО ВЕРХНЬОГО РЯДУ
  width,
  facadeValue,
  finish,
  matKey,
  isFirst = false,
  isLast  = false,
  rowX0,               // зсув лівого краю «шкури» (якщо верхній ряд починається не з 0)
  rowW,                // ширина всієї «шкури» верхнього ряду
  carcassHex = "#e9ecef",
}) {
  const h = UPPER_PRESET.height;
  const d = UPPER_PRESET.depth;
  const yCenter = 1.86;

  // товщини як у нижніх модулів
  const T    = 0.018; // 18 мм
  const BACK = 0.006; // 6 мм
  const backHex = lighten(carcassHex, 0.18);

  return (
    <group position={[posX + width / 2, yCenter, -(0.6 - d)/2]}>
      {/* === КОРПУС (відкритий фронт) ===================================== */}
      <group>
        <mesh castShadow receiveShadow position={[-width/2 + T/2, 0, 0]}>
          <boxGeometry args={[T, h, d]} />
          <meshStandardMaterial color={carcassHex} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh castShadow receiveShadow position={[ width/2 - T/2, 0, 0]}>
          <boxGeometry args={[T, h, d]} />
          <meshStandardMaterial color={carcassHex} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -h/2 + T/2, 0]}>
          <boxGeometry args={[width - 2*T, T, d]} />
          <meshStandardMaterial color={carcassHex} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh castShadow receiveShadow position={[0,  h/2 - T/2, 0]}>
          <boxGeometry args={[width - 2*T, T, d]} />
          <meshStandardMaterial color={carcassHex} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh receiveShadow position={[0, 0, -d/2 + BACK/2]}>
          <boxGeometry args={[width - 2*T, h - 2*T, BACK]} />
          <meshStandardMaterial color={backHex} roughness={0.65} metalness={0.05} />
        </mesh>
      </group>

      {/* Фасади з розкладкою на всю «шкуру» верхнього ряду */}
      {(() => {
        const DOOR_T = 0.016;
        const SIDE_REVEAL = 0.0015;
        const TOPBOT = 0.002;
        const H_GAP = 0.003;
        const SPLIT_W = 0.70;

        const leftRev  = isFirst ? 0 : SIDE_REVEAL;
        const rightRev = isLast  ? 0 : SIDE_REVEAL;

        const faceW   = Math.max(0, width - leftRev - rightRev);
        const xOffset = (rightRev - leftRev) / 2;
        const z       = d/2 + DOOR_T/2 + 0.001;
        const innerH  = Math.max(0, h - 2 * TOPBOT);

        // висота «шкури» по Y
        const SHEET_H = innerH;

        // прямокутник панелі всередині «шкури» верхнього ряду
        // x = лівий край панелі в координатах «шкури»
        // y = низ панелі в координатах «шкури»
        const rectFor = (centerYLocal, panelH) => {
          const x = (posX + leftRev) - (rowX0 || 0);
          const y = (centerYLocal - panelH / 2) + h / 2 - TOPBOT;
          return { x, y, w: faceW, h: panelH };
        };

        if (width >= SPLIT_W) {
          // дві панелі — рендеримо біфолд
          const eachH = (innerH - H_GAP) / 2;
          const y0 = -h/2 + TOPBOT;
          const yBottom = y0 + eachH/2;
          const yTop    = y0 + eachH + H_GAP + eachH/2;

          const rB = rectFor(yBottom, eachH);
          const rT = rectFor(yTop, eachH);

          // Позиція осі обертання верхньої панелі (верхній край фасадного поля)
          const yTopEdge = h/2 - TOPBOT;

          return (
            <BiFoldLiftDoor
              pos={[xOffset, yTopEdge, z]}
              width={faceW}
              h={eachH}
              gap={H_GAP}
              thickness={DOOR_T}
              finish={finish}
              facadeValue={facadeValue}
              sheetRectTop={rT}
              sheetRectBot={rB}
              sheetW={rowW}
              sheetH={SHEET_H}
              matKey={`${matKey}:U:${rT.x}:${rT.y}:${rT.w}:${rT.h}`}
            />
          );
        }

        // одна суцільна панель
        const r = rectFor(0, innerH);
        return (
          <DoorPanel
            key={`U-single-${posX}`}
            center={[xOffset, 0]}
            size={[faceW, innerH]}
            z={z}
            hinge="left"
            thickness={DOOR_T}
            finish={finish}
            facadeValue={facadeValue}
            matKey={`${matKey}:U:${r.x.toFixed(3)}:${r.y.toFixed(3)}:${r.w.toFixed(3)}:${r.h.toFixed(3)}`}
            sheetRect={r}
            sheetW={rowW}
            sheetH={SHEET_H}
            showHandle={false}
          />
        );
      })()}
    </group>
  );
}
