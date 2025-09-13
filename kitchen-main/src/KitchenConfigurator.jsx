// KitchenConfigurator.jsx
import { Perf } from 'r3f-perf';
import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

import "./kitchen.css";
import SwatchPicker from "./components/UI/SwatchPicker";
import AccordionSection from "./components/UI/AccordionSection";
import MetricsHUD from "./components/dev/MetricsHUD";
import ExposeThree from "./components/dev/ExposeThree";
import DesignerKitchen from "./components/DesignerKitchen";

/* ---------- матеріальні пресети (підстав свої шляхи) ---------- */
const FACADE_SETS = [
  { id:"wood_gloss",  label:"Wood texture · gloss",  value:{ base:"/assets/textures/wood_d.jpg",  rough:"/assets/textures/wood_rough.jpg",  normal:"/assets/textures/wood_normal.jpg",  ao:"/assets/textures/wood_ao.jpg" } },
  { id:"wood_grey",    label:"Wood texture · grey",  value:{ base:"/assets/textures/wood_r1.jpg", rough:"/tex/shared/rough.jpg", normal:"/tex/shared/normal.jpg" } },
];

const TOP_SETS = [
  { id:"quartz_white", label:"White Quartz", value:{ base:"/tex/top/quartz_base.jpg", rough:"/tex/top/quartz_rough.jpg", normal:"/tex/top/quartz_normal.jpg" } },
  { id:"dark_slate",   label:"Dark Slate",   value:{ base:"/tex/top/slate_base.jpg",  rough:"/tex/top/slate_rough.jpg",  normal:"/tex/top/slate_normal.jpg" } },
];

const CARCASS_SETS = [
  { id:"carc_white",  label:"White",      value:{ base:"/tex/carcass/white_base.jpg",  rough:"/tex/shared/rough.jpg" } },
  { id:"carc_grey",   label:"Light grey", value:{ base:"/tex/carcass/grey_base.jpg",   rough:"/tex/shared/rough.jpg" } },
  { id:"carc_graph",  label:"Graphite",   value:{ base:"/tex/carcass/graph_base.jpg",  rough:"/tex/shared/rough.jpg" } },
];

/* ---------- МАПІНГ назв матеріалів GLB → категорії ---------- */
/* Звір із консоллю “GLB materials: [...]” з DesignerKitchen і підстав свої назви */
const GLB_TARGET_MATS = {
  facade:  ["Front", "Door", "Facade", "Facade Material"],
  top:     ["Counter", "Top", "Counter_Stone"],
  carcass: ["Carcass", "Box", "Side", "Shelf", "Bottom", "Back"],
};

const DESIGNER_URL = "/assets/kitchen/kitchen-3.glb";
const MODEL_SCALE  = [1,1,1];
const MODEL_POS    = [0,0,0];

export default function KitchenConfigurator() {
  const [three, setThree] = useState(null);
  const [openId, setOpenId] = useState("facade");

  // вибір з акордеону
  const [facadeId, setFacadeId]   = useState(FACADE_SETS[0].id);
  const [topId, setTopId]         = useState(TOP_SETS[0].id);
  const [carcassId, setCarcassId] = useState(CARCASS_SETS[0].id);

  const facadeLabel  = useMemo(() => FACADE_SETS.find(x=>x.id===facadeId)?.label ?? "", [facadeId]);
  const topLabel     = useMemo(() => TOP_SETS.find(x=>x.id===topId)?.label ?? "", [topId]);
  const carcassLabel = useMemo(() => CARCASS_SETS.find(x=>x.id===carcassId)?.label ?? "", [carcassId]);

  // overrides, які полетять у DesignerKitchen
  const overrides = useMemo(() => ({
    sets: {
      facade:  FACADE_SETS.find(x=>x.id===facadeId)?.value,
      top:     TOP_SETS.find(x=>x.id===topId)?.value,
      carcass: CARCASS_SETS.find(x=>x.id===carcassId)?.value,
    },
    targetMats: GLB_TARGET_MATS,
  }), [facadeId, topId, carcassId]);

  // (опц.) приклад дверцят, які можна відкрити кліком — підставити ІМЕНА вузлів із GLB
  const doors = [
    // { name: "Door_L", axis: "y", openRad: Math.PI/2 },
    // { name: "Door_R", axis: "y", openRad: -Math.PI/2 },
  ];

  return (
    <div className="wrap">
      <div className="panel">
        <h1>Kitchen Configurator</h1>

        <AccordionSection
          id="facade" title="Facade finish"
          openId={openId} setOpenId={setOpenId}
          summary={facadeLabel}
        >
          <SwatchPicker options={FACADE_SETS} value={facadeId} onChange={setFacadeId} />
        </AccordionSection>

        <AccordionSection
          id="top" title="Countertop"
          openId={openId} setOpenId={setOpenId}
          summary={topLabel}
        >
          <SwatchPicker options={TOP_SETS} value={topId} onChange={setTopId} />
        </AccordionSection>

        <AccordionSection
          id="carcass" title="Carcass color"
          openId={openId} setOpenId={setOpenId}
          summary={carcassLabel}
        >
          <SwatchPicker options={CARCASS_SETS} value={carcassId} onChange={setCarcassId} />
        </AccordionSection>
      </div>

      <div className="viewport">
        <Canvas
          shadows
          camera={{ position: [2.4, 2.0, 3.4], fov: 35 }}
          onCreated={({ gl }) => {
            if ('outputColorSpace' in gl) gl.outputColorSpace = THREE.SRGBColorSpace;
            else gl.outputEncoding = THREE.sRGBEncoding;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[2.5, 5, 3]} intensity={1.2} castShadow shadow-normalBias={0.02}
            shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          <Environment preset="city" />

          <group>
            <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
              <planeGeometry args={[12, 12]} />
              <meshStandardMaterial color="#fafafa" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
            <gridHelper args={[12, 24, "#d0d0d0", "#e7e7e7"]} />
          </group>

          <DesignerKitchen
            url={DESIGNER_URL}
            overrides={overrides}
            doors={doors}
            position={MODEL_POS}
            scale={MODEL_SCALE}
          />

          <ContactShadows position={[0, 0, 0]} opacity={0.25} width={8} height={8} blur={1.4} far={1.5} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={1.8} target={[0, 0.95, 0]} />
          <Perf position="top-right" minimal />
          <ExposeThree onReady={setThree} />
        </Canvas>

        <MetricsHUD three={three} position="bottom-right" />
      </div>
    </div>
  );
}
