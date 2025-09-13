import React from "react";

export default function Countertop({ length, depth=0.63, thickness=0.04, color="#efefef", cutout=null }) {
  const y = 0.9 + thickness / 2;
  if (!cutout) {
    return (
      <mesh position={[length/2, y, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, thickness, depth]} />
        <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.05} />
      </mesh>
    );
  }
  const cx = cutout.x, cw = cutout.w, cd = cutout.d;
  const front = (depth - cd) / 2, back = depth - cd - front;
  const leftLen  = Math.max(0, cx - cw/2), rightLen = Math.max(0, length - (cx + cw/2));
  const frontDepth = Math.max(0, front), backDepth = Math.max(0, back);
  const leftX = leftLen/2, rightX = length - rightLen/2;
  const frontZ = -depth/2 + frontDepth/2, backZ = depth/2 - backDepth/2;

  return (
    <group>
      {leftLen > 1e-4 && (
        <mesh position={[leftX, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[leftLen, thickness, depth]} />
          <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {rightLen > 1e-4 && (
        <mesh position={[rightX, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[rightLen, thickness, depth]} />
          <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {frontDepth > 1e-4 && (
        <mesh position={[cx, y, frontZ]} castShadow receiveShadow>
          <boxGeometry args={[cw, thickness, frontDepth]} />
          <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
      {backDepth > 1e-4 && (
        <mesh position={[cx, y, backZ]} castShadow receiveShadow>
          <boxGeometry args={[cw, thickness, backDepth]} />
          <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
      )}
    </group>
  );
}
