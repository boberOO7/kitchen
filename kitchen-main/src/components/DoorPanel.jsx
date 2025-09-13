// components/doors/DoorPanel.jsx
import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import FacadeMat from "./FacadeMat";

/**
 * Дверка з шарніром по краю і кліком для відкриття/закриття.
 * ПІВІСЬ (вісь обертання) стоїть на краю дверки (ліво/право).
 *
 * props:
 *  - center: [x,y] — центр панелі (де вона стоїть у закритому стані)
 *  - size:   [w,h]
 *  - z:      номер по Z (фронт)
 *  - hinge:  "left" | "right"
 *  - thickness: товщина фасаду
 *  - finish, facadeValue, matKey, sheetRect, sheetW, sheetH — як у FacadeMat
 */
export default function DoorPanel({
  center = [0, 0],
  size = [0.5, 0.7],
  z = 0,
  hinge = "left",
  thickness = 0.018,
  // матеріал
  finish,
  facadeValue,
  matKey,
  sheetRect,
  sheetW,
  sheetH,
  // опціонально: старт відкритий
  defaultOpen = false,
  showHandle = true,
}) {
  const [targetOpen, setTargetOpen] = useState(defaultOpen ? 1 : 0);
  const rotRef = useRef(null);

  // кут відкриття (до 90°)
  const OPEN_RAD = Math.PI / 2;

  // проста “дампінг” анімація до цільового кута
  useFrame((_, dt) => {
    if (!rotRef.current) return;
    const dst = (hinge === "left" ? -1 : 1) * targetOpen * OPEN_RAD;
    const cur = rotRef.current.rotation.y;
    const diff = dst - cur;
    const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 5); // швидкість ~5 рад/с
    rotRef.current.rotation.y = cur + step;
  });

  const [w, h] = size;
  const [cx, cy] = center;

  // ПІВІСЬ: ставимо групу на лівий/правий край дверки
  const hingeX = cx + (hinge === "left" ? -w / 2 : w / 2);

  return (
    <group position={[hingeX, cy, z]}>
      {/* група, що обертається навколо осі Y на краю */}
      <group ref={rotRef}>
        {/* сам фасад відсунемо від осі на ширину/2, щоб край співпав з півіссю */}
        <mesh
          position={[hinge === "left" ? w / 2 : -w / 2, 0, 0]}
          castShadow
          // важливо: не пускати клік далі, інакше спрацює drag модуля
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setTargetOpen((v) => (v ? 0 : 1));
          }}
        >
          <boxGeometry args={[w, h, thickness]} />
          <FacadeMat
            value={facadeValue}
            finish={finish}
            matKey={matKey}
            sheetRect={sheetRect}
            sheetW={sheetW}
            sheetH={sheetH}
          />
        </mesh>

        {/* Ручка — їде разом із дверкою */}
        {showHandle && (
            <mesh position={[ (hinge==="left"? w/2 : -w/2),  h/2 - 0.08, thickness/2 + 0.01 ]}>
            <boxGeometry args={[0.12, 0.02, 0.02]} />
            <meshStandardMaterial color="#777" metalness={0.8} roughness={0.3} />
            </mesh>
        )}
      </group>
    </group>
  );
}
