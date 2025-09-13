import React from "react";
import { UPPER_PRESET } from "../data/constants";

export default function RangeHood({ xCenter=0.9, width=0.6 }) {
  const bodyY = 1.29;
  const depth = 0.35;
  return (
    <group position={[xCenter, bodyY + 0.2, -(0.6 - UPPER_PRESET.depth)/2 + (UPPER_PRESET.depth - depth)/2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.02, depth]} />
        <meshStandardMaterial color="#d9d9d9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 24]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}
