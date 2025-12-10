"use client";

import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function useAntiShimmer(root) {
  const { gl } = useThree();
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy?.() || 1;
    const setTex = (t) => {
      if (!t || !t.isTexture) return;
      t.anisotropy = Math.min(maxAniso, 8);
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
    };

    root.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        ["map", "roughnessMap", "metalnessMap", "normalMap", "aoMap", "emissiveMap"].forEach((k) => setTex(m[k]));
        if ("roughness" in m) m.roughness = Math.max(0.25, m.roughness ?? 0.5);
        if ("envMapIntensity" in m) m.envMapIntensity = Math.min(1.0, m.envMapIntensity ?? 1.0);
      });
    });
  }, [root, gl]);
}

