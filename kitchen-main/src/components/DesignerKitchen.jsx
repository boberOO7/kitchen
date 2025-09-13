// components/DesignerKitchen.jsx
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

// швидкі лоадери з правильним colorSpace/flipY для glTF
const tl = new THREE.TextureLoader();
const loadColor = (url) => { const t = tl.load(url); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; return t; };
const loadLinear = (url) => { const t = tl.load(url); t.colorSpace = THREE.LinearSRGBColorSpace; t.flipY = false; return t; };

// overrides:
// {
//   sets: { // що обрано в UI
//     facade: { base, rough, normal, ao, metal },
//     top:    { ... },
//     carcass:{ ... },
//   },
//   targetMats: { // до яких матів GLB це застосувати
//     facade:  ["Front", "Door", "Facade Material"],
//     top:     ["Counter", "Top Stone"],
//     carcass: ["Carcass", "Box", "Side", "Shelf"]
//   }
// }
// doors (необов’язково):
//   [{ name: "Door_L", axis: "y", openRad: Math.PI/2 }]
export default function DesignerKitchen({
  url,
  overrides,
  doors = [],       // масив дверок за іменами мешів в GLB
  ...props
}) {
  const { scene, materials } = useGLTF(url);

  // 1) тіні
  useEffect(() => {
    scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }, [scene]);

  // 2) репорт назв матеріалів (1 раз, щоб звірити з GLB)
  useEffect(() => {
    const names = Object.keys(materials ?? {});
    console.log("GLB materials:", names);
  }, [materials]);

  // 3) підміна карт матеріалів згідно overrides
  useEffect(() => {
    if (!overrides?.sets || !overrides?.targetMats) return;

    const applySetToMat = (mat, set) => {
      if (!mat || !set) return;
      if (set.base)     mat.map          = loadColor(set.base);
      if (set.rough)    mat.roughnessMap = loadLinear(set.rough);
      if (set.metal)    mat.metalnessMap = loadLinear(set.metal);
      if (set.normal)   mat.normalMap    = loadLinear(set.normal);
      if (set.ao)       mat.aoMap        = loadLinear(set.ao);
      mat.needsUpdate = true;
      mat.envMapIntensity = 0.6;
    };

    const { sets, targetMats } = overrides;

    const patchBucket = (bucketKey) => {
      const set  = sets[bucketKey];
      const list = targetMats[bucketKey] || [];
      list.forEach(name => {
        const m = materials[name];
        if (m) applySetToMat(m, set);
      });
    };

    patchBucket("facade");
    patchBucket("top");
    patchBucket("carcass");
  }, [materials, overrides]);

  // 4) дверцята з кліком (спрацює, якщо в GLB правильно виставлено pivot на завісі)
  //    Якщо pivot не на завісі в експорті — у DCC (3ds Max) треба виставити його перед експортом.
  const doorState = useRef({});
  const doorRefs  = useRef({});

  // створюємо посилання на дверні вузли за іменем
  useEffect(() => {
    doors.forEach(d => {
      const node = scene.getObjectByName(d.name);
      if (node) {
        doorRefs.current[d.name] = node;
        if (doorState.current[d.name] == null) doorState.current[d.name] = 0; // 0 — закрито
        // курсор/події
        node.cursor = "pointer";
        node.onPointerDown = (e) => { e.stopPropagation(); doorState.current[d.name] = doorState.current[d.name] ? 0 : 1; };
      } else {
        console.warn("Door node not found:", d.name);
      }
    });
  }, [scene, doors]);

  // анімація до цільового кута
  useFrame((_, dt) => {
    doors.forEach(d => {
      const n = doorRefs.current[d.name];
      if (!n) return;
      const open = doorState.current[d.name] || 0;
      const dst  = (d.axis === "x" ? [d.openRad, "x"] : d.axis === "z" ? [d.openRad, "z"] : [d.openRad, "y"]);
      const axis = dst[1];
      const target = open ? (d.openRad ?? Math.PI/2) : 0;
      const cur = n.rotation[axis];
      const diff = target - cur;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 5);
      n.rotation[axis] = cur + step;
    });
  });

  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/assets/kitchen/kitchen-3.glb");
