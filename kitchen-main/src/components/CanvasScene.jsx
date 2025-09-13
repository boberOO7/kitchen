import React, { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { Plane, Vector3 } from "three";
import ModuleBox from "./Base/ModuleBox";
import UpperCabinet from "./Upper/UpperCabinet";
import Countertop from "./Countertop";
import RangeHood from "./RangeHood";
import { Floor } from "./Misc";
import { clamp, snap } from "../utils/plan";

export default function CanvasScene({
  positions, total, upperPositions, sinkCenter, hoodCenter,
  facadeValue, finish, facadeMatKey,
  countertop, showUpper, showHood,
  onStartDrag3D, onMove3D, onEnd3D, drag, groupRef
}) {
  return (
    <Canvas shadows camera={{ position: [2.4, 2.0, 3.4], fov: 35 }} onPointerMissed={onEnd3D}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2.5, 5, 3]} intensity={1.2} castShadow shadow-normalBias={0.02} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <Environment preset="city" />

      <Floor size={Math.max(8, total + 2)} />

      <group
        ref={groupRef}
        position={[-total / 2, 0, 0]}
        onPointerMove={onMove3D}
        onPointerUp={onEnd3D}
        onPointerCancel={onEnd3D}
        onLostPointerCapture={onEnd3D}
      >
        {positions.map(({ module, x }, i) => (
          <ModuleBox
            key={`${module.id}-${i}`}
            posX={drag?.i === i ? drag.x : x}
            module={module}
            facadeValue={facadeValue}
            matKey={facadeMatKey}
            finish={finish}
            onStartDrag={(e) => onStartDrag3D(e, i, module)}
          />
        ))}

        <Countertop length={total} color={countertop?.hex} cutout={sinkCenter ? { x: sinkCenter, w: 0.54, d: 0.44 } : null} />

        {showUpper && upperPositions.map((u, idx) => (
          <UpperCabinet
            key={`u-${idx}-${u.x.toFixed(3)}`}
            posX={u.x}
            width={u.width}
            facadeValue={facadeValue}
            matKey={facadeMatKey}
            finish={finish}
            isFirst={idx===0}
            isLast={idx===upperPositions.length-1}
          />
        ))}

        {showHood && <RangeHood xCenter={hoodCenter} width={0.6} />}
      </group>

      <ContactShadows position={[0, 0, 0]} opacity={0.25} width={8} height={8} blur={1.4} far={1.5} />
      <OrbitControls makeDefault enabled={!drag} minPolarAngle={0} maxPolarAngle={1.8} target={[0, 0.95, 0]} />
    </Canvas>
  );
}
