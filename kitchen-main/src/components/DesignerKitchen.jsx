// components/DesignerKitchen.jsx
import React, { useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/**
 * Допоміжні лоадери для PBR-карт:
 * - baseColor (sRGB)
 * - інші карти (linear)
 * glTF очікує flipY=false
 */
const texLoader = new THREE.TextureLoader();
function loadColor(url) {
  const t = texLoader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  return t;
}
function loadLinear(url) {
  const t = texLoader.load(url);
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.flipY = false;
  return t;
}

/**
 * DesignerKitchen
 * @param {string} url - шлях до GLB
 * @param {object[]} materialMap - необовʼязковий масив відповідностей:
 *   [{
 *     matName: "Front_Wood",                // назва матеріалу в GLB
 *     baseColor: "/textures/wood_base.jpg", // опційно
 *     roughness: "/textures/wood_rough.jpg",
 *     metalness: "/textures/wood_metal.jpg",
 *     normal: "/textures/wood_normal.jpg",
 *     ao: "/textures/wood_ao.jpg"
 *   }, ...]
 * Інші пропси (position, scale, rotation…) передаються у <primitive/>
 */
export default function DesignerKitchen({
  url = "/assets/kitchen/Kitchen.glb",
  materialMap = [],  // можна передати ззовні; якщо не передати — нічого не патчимо
  ...props
}) {
  const { scene, materials } = useGLTF(url);

  useEffect(() => {
    // Разовий список матеріалів для зручного мапінгу
    if (process.env.NODE_ENV !== "production") {
      const names = Object.keys(materials || {});
      // eslint-disable-next-line no-console
      console.log("GLB materials:", names);
    }

    // Патчимо матеріали, якщо передані мапінги
    materialMap.forEach(p => {
      const m = materials?.[p.matName];
      if (!m) return;

      if (p.baseColor)  m.map          = loadColor(p.baseColor);
      if (p.roughness)  m.roughnessMap = loadLinear(p.roughness);
      if (p.metalness)  m.metalnessMap = loadLinear(p.metalness);
      if (p.normal)     m.normalMap    = loadLinear(p.normal);
      if (p.ao)         m.aoMap        = loadLinear(p.ao);

      // невеличка поліровка PBR
      m.needsUpdate = true;
      m.envMapIntensity = 0.6;
    });

    // Тіні на всіх мешах
    scene.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [scene, materials, materialMap]);

  return <primitive object={scene} {...props} />;
}

// (Опційно) попереднє завантаження.
// Постав тут свій основний шлях до GLB, або додай ще один рядок із іншим шляхом.
useGLTF.preload("/assets/kitchen/Kitchen.glb");
