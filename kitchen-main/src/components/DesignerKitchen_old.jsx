import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

function textureInfo(t) {
  if (!t) return null;
  const img = t.image || {};
  return {
    name: t.name || "",
    w: img.width || img.videoWidth || null,
    h: img.height || img.videoHeight || null,
    colorSpace: t.colorSpace || t.encoding, // r152+ vs старі три
    flipY: !!t.flipY,
  };
}

function approxTriangles(geom) {
  if (!geom?.isBufferGeometry) return null;
  // індекс (якщо є) — найточніше; інакше за позиціями
  if (geom.index?.count) return Math.round(geom.index.count / 3);
  const pos = geom.getAttribute?.("position");
  return pos ? Math.round(pos.count / 3) : null;
}

function collectSceneTree(root) {
  const tree = [];
  const walk = (o, depth = 0, path = o.name || o.type) => {
    tree.push({
      depth,
      path,
      id: o.uuid,
      name: o.name || "",
      type: o.type,
      children: o.children?.length || 0,
      isMesh: !!o.isMesh,
      material: o.isMesh ? (o.material?.name || o.material?.type || "") : "",
    });
    o.children?.forEach(c => walk(c, depth + 1, `${path}/${c.name || c.type}`));
  };
  walk(root, 0, root.name || "Scene");
  return tree;
}

function collectMeshes(root) {
  const arr = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const m = o.material;
    arr.push({
      objName: o.name || "",
      matName: m?.name || "",
      matType: m?.type || "",
      geoType: g?.type || "",
      tris: approxTriangles(g),
      hasUV: !!g?.getAttribute?.("uv"),
      hasUV2: !!g?.getAttribute?.("uv2"),
      path: o.parent ? `${o.parent.name || o.parent.type}/${o.name || o.type}` : (o.name || o.type),
    });
  });
  return arr;
}

function collectMaterials(materialsDict) {
  const out = [];
  const values = materialsDict ? Object.values(materialsDict) : [];
  values.forEach(m => {
    if (!m) return;
    out.push({
      name: m.name || "",
      type: m.type || "",
      color: m.color ? `#${m.color.getHexString?.()}` : "",
      roughness: m.roughness ?? "",
      metalness: m.metalness ?? "",
      clearcoat: m.clearcoat ?? "",
      map: !!m.map,        normal: !!m.normalMap,
      roughMap: !!m.roughnessMap, metalMap: !!m.metalnessMap, aoMap: !!m.aoMap,
    });
  });
  return out;
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DesignerKitchen({
  url,
  facadePreset,
  targetNames = [],
  debug = false,          // ← УВІМКНИ ДЛЯ ЛОГІВ
  debugDownload = false,  // ← ЗБЕРЕГТИ JSON
  ...props
}) {
  const { scene, materials } = useGLTF(url);

  // (опціонально – базове налаштування PBR і тіней)
  useEffect(() => {
    scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }, [scene]);

  // ===================== DEBUG DUMP =====================
  useEffect(() => {
    if (!debug) return;

    // дерево
    const tree = collectSceneTree(scene);
    // меші
    const meshes = collectMeshes(scene);
    // матеріали
    const mats = collectMaterials(materials);

    console.groupCollapsed("%cGLB Structure", "color:#16a34a;font-weight:600");
    console.log("Nodes (tree):", tree.length);
    console.table(tree);
    console.groupCollapsed("Meshes"); console.table(meshes); console.groupEnd();
    console.groupCollapsed("Materials"); console.table(mats); console.groupEnd();

    // детально по матеріалах + карти
    console.groupCollapsed("Materials detailed (+maps)");
    (materials ? Object.values(materials) : []).forEach(m => {
      if (!m) return;
      const info = {
        name: m.name, type: m.type, color: m.color ? `#${m.color.getHexString?.()}` : "",
        roughness: m.roughness, metalness: m.metalness, clearcoat: m.clearcoat,
        map: textureInfo(m.map),
        normalMap: textureInfo(m.normalMap),
        roughnessMap: textureInfo(m.roughnessMap),
        metalnessMap: textureInfo(m.metalnessMap),
        aoMap: textureInfo(m.aoMap),
      };
      console.groupCollapsed(m.name || m.type);
      console.log(info);
      console.groupEnd();
    });
    console.groupEnd(); // materials detailed

    console.groupEnd(); // GLB Structure

    if (debugDownload) {
      downloadJSON("glb-inspect.json", { tree, meshes, materials: mats });
    }
  }, [debug, debugDownload, scene, materials]);
  // ======================================================

  // (тут може лишатися твоя логіка призначення матеріалів/пресетів — я її не міняю)
  useEffect(() => {
    if (!facadePreset) return;

    const load = (url, linear = false) => {
      if (!url) return null;
      const t = new THREE.TextureLoader().load(url);
      t.colorSpace = linear ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
      t.flipY = false;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      return t;
    };

    const maps = {
      map:          load(facadePreset.base, false),
      normalMap:    load(facadePreset.normal, true),
      roughnessMap: load(facadePreset.roughness, true),
      metalnessMap: load(facadePreset.metalness, true),
      aoMap:        load(facadePreset.ao, true),
    };

    const looksLikeFacade = (objName = "", matName = "") => {
      const s = (objName + " " + matName).toLowerCase();
      const hint = /(facade|front|door|drawer|panel)/i.test(s);
      const explicit = targetNames.some(n =>
        objName === n || matName === n || s.includes(n.toLowerCase())
      );
      return hint || explicit;
    };

    let patched = 0;
    scene.traverse(o => {
      if (!o.isMesh) return;
      if (!looksLikeFacade(o.name, o.material?.name)) return;

      const g = o.geometry;
      if (g && !g.getAttribute("uv2") && g.getAttribute("uv")) g.setAttribute("uv2", g.getAttribute("uv"));

      let m = o.material;
      if (!(m?.isMeshStandardMaterial || m?.isMeshPhysicalMaterial)) {
        m = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
        o.material = m;
      }

      Object.entries(maps).forEach(([k, tex]) => { if (tex) m[k] = tex; });
      m.roughness ??= 0.5;
      m.metalness ??= 0.0;
      m.envMapIntensity = 0.6;
      m.needsUpdate = true;
      patched++;
    });

    if (debug) console.log(`[DesignerKitchen] Facade patched on ${patched} mesh(es).`);
  }, [scene, facadePreset, targetNames, debug]);

  return <primitive object={scene} {...props} />;
}
