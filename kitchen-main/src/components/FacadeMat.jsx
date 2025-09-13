// FacadeMat.jsx
import React from "react";
import { ClampToEdgeWrapping } from "three";
import { useTexture } from "@react-three/drei";
import { ONE_PX } from "../data/constants"; // або твій шлях

export default function FacadeMat({
  value,
  finish,
  matKey,
  sheetRect,      // {x,y,w,h} для конкретної панелі, у КООРД. РЯДУ
  sheetW,         // загальна ширина ряду (м)
  sheetH          // загальна висота видимої «шкіри» ряду (м)
}) {
  const isImage = typeof value === "string" && !value.startsWith("#");
  const base = useTexture(isImage ? value : ONE_PX);
  // const tex = useMemo(() => isImage ? base.clone() : null, [base, isImage, matKey]);
  const tex = React.useMemo(() => {
    if (!isImage) return null;
    const t = base.clone();
    t.needsUpdate = true;
    return t;
  }, [isImage, base, matKey]);

  React.useEffect(() => {
    const t = isImage ? tex : base;
    if (!t) return;
    t.wrapS = t.wrapT = ClampToEdgeWrapping;   // НЕ тайлити, одна «шкура» на весь ряд
    if (isImage && sheetRect && sheetW && sheetH) {
      t.repeat.set(sheetRect.w / sheetW, sheetRect.h / sheetH);
      t.offset.set(sheetRect.x / sheetW, sheetRect.y / sheetH);
    } else {
      t.repeat.set(1, 1);
      t.offset.set(0, 0);
    }
  }, [isImage, tex, base, sheetRect, sheetW, sheetH]);

  return (
    <meshPhysicalMaterial
      key={matKey}
      color={isImage ? "#fff" : (value || "#fff")}
      map={isImage ? tex : undefined}
      roughness={finish === "gloss" ? 0.25 : 0.8}
      metalness={finish === "gloss" ? 0.2 : 0.05}
      clearcoat={finish === "gloss" ? 0.7 : 0.1}
      clearcoatRoughness={finish === "gloss" ? 0.1 : 0.6}
    />
  );
}
