"use client";

import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function useAntiShimmer(root: THREE.Object3D) {
  const { gl } = useThree();
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy?.() || 1;
    const setTex = (t: THREE.Texture | null | undefined) => {
      if (!t || !t.isTexture) return;
      t.anisotropy = Math.min(maxAniso, 8);
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
    };

    root.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        ["map", "roughnessMap", "metalnessMap", "normalMap", "aoMap", "emissiveMap"].forEach((k) => 
          setTex((mat as Record<string, THREE.Texture | null>)[k])
        );
        if ("roughness" in mat) mat.roughness = Math.max(0.25, mat.roughness ?? 0.5);
        if ("envMapIntensity" in mat) mat.envMapIntensity = Math.min(1.0, mat.envMapIntensity ?? 1.0);
      });
    });
  }, [root, gl]);
}
