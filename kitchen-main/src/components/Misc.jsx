import React from "react";
import { Html } from "@react-three/drei";

export function Floor({ size = 8 }) {
  return (
    <group>
      <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#fafafa" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <gridHelper args={[size, size*2, "#d0d0d0", "#e7e7e7"]} position={[0,0,0]} />
    </group>
  );
}

export function Ruler({ length }) {
  return (
    <group position={[0,0,0.5]}>
      <mesh><boxGeometry args={[length, 0.002, 0.002]} /><meshBasicMaterial /></mesh>
      {Array.from({ length: Math.ceil(length/0.1) + 1 }).map((_, i) => (
        <mesh key={i} position={[i*0.1, 0, 0]}>
          <boxGeometry args={[0.0015, 0.002, 0.01]} />
          <meshBasicMaterial />
        </mesh>
      ))}
      <Html position={[length/2, 0.02, 0.06]} center>
        <div style={{ fontSize: 12, padding:"2px 6px", borderRadius: 6, background:"rgba(255,255,255,0.8)", boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}>
          {length.toFixed(2)} m
        </div>
      </Html>
    </group>
  );
}
