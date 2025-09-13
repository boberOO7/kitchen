// components/DesignerKitchen.jsx
import React, { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

export default function DesignerKitchen({ url="/assets/kitchen/Kitchen 3.glb", ...props }) {
  const { scene, materials } = useGLTF(url);

  useMemo(() => {
    // базова поліровка матеріалів
    Object.values(materials ?? {}).forEach(m => {
      if (!m) return;
      if (m.map) m.map.encoding = THREE.sRGBEncoding;
      ["roughnessMap","metalnessMap","aoMap","normalMap"].forEach(k => m[k] && (m[k].encoding = THREE.LinearEncoding));
      m.envMapIntensity = 0.6;
    });
    scene.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }, [materials, scene]);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload("/assets/kitchen/Kitchen 3.glb");

useEffect(() => {
  gltf.scene.traverse(o => {
    const m = o.material;
    if (m) {
      console.log(o.name, m.name, {
        hasMap: !!m.map,
        hasNormal: !!m.normalMap,
        hasRough: !!m.roughnessMap,
        baseColor: m.color?.getHexString?.(),
      });
    }
  });
}, [gltf]);
