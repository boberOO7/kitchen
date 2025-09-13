// components/doors/BiFoldLiftDoor.jsx
import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import FacadeMat from "./FacadeMat";

/**
 * Біфолд дверка (на кшталт Blum Aventos HF):
 * два горизонтальних фасади, які при кліку разом підіймаються догори,
 * складаючись навпіл (верхня обертається за верхній край секції, нижня — за лінію стику).
 *
 * Параметри:
 * - pos:     [x,y,z] — позиція ВЕРХНЬОГО КРАЮ верхньої панелі (вісь обертання верхньої)
 * - width:   ширина фасаду
 * - h:       висота ОДНІЄЇ панелі (тобто половини секції)
 * - gap:     щілина між панелями
 * - thickness: товщина фасаду
 * - finish, facadeValue, sheetRectTop, sheetRectBot, sheetW, sheetH, matKey — як у FacadeMat
 * - defaultOpen: стартовий стан (false)
 */
export default function BiFoldLiftDoor({
  pos = [0, 0, 0],
  width,
  h,
  gap = 0.003,
  thickness = 0.016,
  // матеріал
  finish,
  facadeValue,
  sheetRectTop,
  sheetRectBot,
  sheetW,
  sheetH,
  matKey,
  defaultOpen = false,
}) {
  const rootRef = useRef(null);     // обертання всього вузла за верхній край
  const midRef  = useRef(null);     // обертання нижньої за лінію стику
  const [targetOpen, setTargetOpen] = useState(defaultOpen ? 1 : 0);

  // кути (рад) — підібрані «на око», щоб виглядало природно
  const TOP_MAX = 1.55;  // ~66°
  const BOT_MAX = 1.85;  // ~95°

  useFrame((_, dt) => {
    const lerpStep = Math.min(1, dt * 5); // демпфування
    // відчиняємо «назад», тому мінус по осі X
    if (rootRef.current) {
      const dst = -targetOpen * TOP_MAX;
      rootRef.current.rotation.x += (dst - rootRef.current.rotation.x) * lerpStep;
    }
    if (midRef.current) {
      const dst = targetOpen * BOT_MAX;
      midRef.current.rotation.x += (dst - midRef.current.rotation.x) * lerpStep;
    }
  });

  // зручності
  const onToggle = (e) => {
    e.stopPropagation();
    setTargetOpen((v) => (v ? 0 : 1));
  };

  const [x, y, z] = pos;

  return (
    <group position={[x, y, z]}>
      {/* Вісь верхньої панелі — верхній край секції */}
      <group ref={rootRef}>
        {/* Верхня панель: її центр на піввисоти нижче осі */}
        <mesh
          position={[0, -h / 2, 0]}
          castShadow
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onToggle}
        >
          <boxGeometry args={[width, h, thickness]} />
          <FacadeMat
            value={facadeValue}
            finish={finish}
            matKey={`${matKey}:U-T`}
            sheetRect={sheetRectTop}
            sheetW={sheetW}
            sheetH={sheetH}
          />
        </mesh>

        {/* Вісь складання (між панелями): на h + gap нижче верхньої осі */}
        <group ref={midRef} position={[0, -(h + gap), 0]}>
          {/* Нижня панель: центр на піввисоти нижче осі складання */}
          <mesh
            position={[0, -h / 2, 0]}
            castShadow
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggle}
          >
            <boxGeometry args={[width, h, thickness]} />
            <FacadeMat
              value={facadeValue}
              finish={finish}
              matKey={`${matKey}:U-B`}
              sheetRect={sheetRectBot}
              sheetW={sheetW}
              sheetH={sheetH}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
