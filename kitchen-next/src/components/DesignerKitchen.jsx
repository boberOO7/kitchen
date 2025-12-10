"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useAntiShimmer } from "./useAntiShimer";

// --- utils: розбити BufferGeometry на connected components
function splitConnectedComponents(geometry) {
  const index = geometry.index;
  const pos = geometry.attributes.position;
  const vertCount = pos.count;
  const faceCount = (index ? index.count : vertCount) / 3;

  const triVerts = (t) => {
    if (index) return [index.getX(3 * t), index.getX(3 * t + 1), index.getX(3 * t + 2)];
    return [3 * t, 3 * t + 1, 3 * t + 2];
  };

  const vertToTris = Array.from({ length: vertCount }, () => []);
  for (let t = 0; t < faceCount; t++) {
    const [a, b, c] = triVerts(t);
    vertToTris[a].push(t); vertToTris[b].push(t); vertToTris[c].push(t);
  }

  const visited = new Uint8Array(faceCount);
  const components = [];
  const deque = [];

  for (let start = 0; start < faceCount; start++) {
    if (visited[start]) continue;
    visited[start] = 1;
    deque.length = 0;
    deque.push(start);
    const faces = [];

    while (deque.length) {
      const t = deque.pop();
      faces.push(t);
      const vs = triVerts(t);
      for (const v of vs) {
        const adj = vertToTris[v];
        for (const nt of adj) {
          if (!visited[nt]) { visited[nt] = 1; deque.push(nt); }
        }
      }
    }
    components.push(faces);
  }

  const out = [];
  for (const faces of components) {
    const idx = [];
    for (const t of faces) {
      const [a, b, c] = triVerts(t);
      idx.push(a, b, c);
    }
    const remap = new Map(); let next = 0;
    const compactIndex = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) {
      const v = idx[i];
      if (!remap.has(v)) remap.set(v, next++);
      compactIndex[i] = remap.get(v);
    }
    const newPos = new Float32Array(next * 3);
    remap.forEach((to, from) => {
      newPos[3 * to + 0] = pos.getX(from);
      newPos[3 * to + 1] = pos.getY(from);
      newPos[3 * to + 2] = pos.getZ(from);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(newPos, 3));
    g.setIndex(new THREE.BufferAttribute(compactIndex, 1));
    if (geometry.attributes.normal) g.computeVertexNormals();
    g.computeBoundingBox();
    out.push(g);
  }

  return out;
}

function makeDoorFromGeometry(geom, baseMaterial) {
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  const hingeX = bb.min.x;
  const centerY = (bb.min.y + bb.max.y) / 2;
  const centerZ = (bb.min.z + bb.max.z) / 2;

  const pivot = new THREE.Group();
  pivot.position.set(hingeX, centerY, centerZ);

  const mesh = new THREE.Mesh(geom, baseMaterial.clone());
  mesh.position.set(-hingeX, -centerY, -centerZ);
  mesh.castShadow = mesh.receiveShadow = true;

  pivot.add(mesh);
  return { pivot, mesh, hingeX };
}

function textureInfo(t) {
  if (!t) return null;
  const img = t.image || {};
  return {
    name: t.name || "",
    w: img.width || img.videoWidth || null,
    h: img.height || img.videoHeight || null,
    colorSpace: t.colorSpace || t.encoding,
    flipY: !!t.flipY,
  };
}

function approxTriangles(geom) {
  if (!geom?.isBufferGeometry) return null;
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
    o.children?.forEach((c) => walk(c, depth + 1, `${path}/${c.name || c.type}`));
  };
  walk(root, 0, root.name || "Scene");
  return tree;
}

function collectMeshes(root) {
  const arr = [];
  root.traverse((o) => {
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
  values.forEach((m) => {
    if (!m) return;
    out.push({
      name: m.name || "",
      type: m.type || "",
      color: m.color ? `#${m.color.getHexString?.()}` : "",
      roughness: m.roughness ?? "",
      metalness: m.metalness ?? "",
      clearcoat: m.clearcoat ?? "",
      map: !!m.map, normal: !!m.normalMap,
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

// Глобальний кеш дверей для кожної моделі (за url)
const DOORS_CACHE = new Map();

// Helper функція для створення дверей для сцени
function createDoorsForScene(scene, url) {
  // Перевіряємо кеш
  if (DOORS_CACHE.has(url)) {
    const cached = DOORS_CACHE.get(url);
    console.log(`[DOORS CACHE] Використовуємо кешовані двері для ${url}`);
    // Перевіряємо чи двері ще валідні
    if (cached.container && cached.parent) {
      // Ховаємо glassMesh якщо він був показаний
      if (cached.glassMesh) {
        cached.glassMesh.visible = false;
      }
      return cached;
    }
    // Якщо кеш невалідний, видаляємо його
    console.warn(`[DOORS CACHE] Кеш невалідний для ${url}, видаляємо`);
    DOORS_CACHE.delete(url);
  }

  console.log(`[DOORS CACHE] Створюємо нові двері для ${url}`);
  const arr = [];
  let container = null;
  let parent = null;

  const glassMesh = scene.getObjectByName("Facade_glass_1");
  if (!glassMesh || !glassMesh.isMesh) return { doors: arr, container: null, parent: null };

  const parts = splitConnectedComponents(glassMesh.geometry);

  parent = glassMesh.parent || scene;
  container = new THREE.Group();
  container.name = "GlassDoorsRoot";
  container.position.copy(glassMesh.position);
  container.quaternion.copy(glassMesh.quaternion);
  container.scale.copy(glassMesh.scale);

  for (let i = 0; i < parts.length; i++) {
    const { pivot, mesh } = makeDoorFromGeometry(parts[i], glassMesh.material);
    pivot.name = `GlassDoor_${i + 1}`;
    pivot.userData = { open: 0, openRad: Math.PI / 2, axis: "y" };
    arr.push(pivot);
  }

  glassMesh.visible = false;
  arr.forEach((p) => container.add(p));

  const data = { doors: arr, container, parent, glassMesh };
  // Зберігаємо в кеш
  DOORS_CACHE.set(url, data);
  console.log(`[DOORS CACHE] Збережено в кеш. Всього в кеші: ${DOORS_CACHE.size}`);
  return data;
}

// Helper функція для dispose дверей
function disposeDoorsData(doorsData) {
  if (!doorsData) return;
  const { container, parent, glassMesh } = doorsData;
  
  if (container && parent) {
    container.traverse((o) => {
      if (o.isMesh) {
        if (o.geometry) {
          o.geometry.dispose();
        }
        if (o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach((mat) => {
              if (mat && mat.dispose) mat.dispose();
            });
          } else if (o.material.dispose) {
            o.material.dispose();
          }
        }
      }
    });
    
    if (parent.children.includes(container)) {
      parent.remove(container);
    }
    container.clear();
  }
  
  // Показуємо назад оригінальний glassMesh
  if (glassMesh) {
    glassMesh.visible = true;
  }
}

// Експортна функція для очистки кешу (може бути корисна для dev tools або при unmount додатку)
export function clearDoorsCache(url) {
  if (url) {
    // Очищаємо конкретний url
    const data = DOORS_CACHE.get(url);
    if (data) {
      disposeDoorsData(data);
      DOORS_CACHE.delete(url);
      console.log(`[DOORS CACHE] Видалено з кешу: ${url}`);
    }
  } else {
    // Очищаємо весь кеш
    DOORS_CACHE.forEach((data, url) => {
      disposeDoorsData(data);
    });
    DOORS_CACHE.clear();
    console.log(`[DOORS CACHE] Кеш повністю очищено`);
  }
}

// Експортна функція для отримання статистики кешу
export function getDoorsChacheStats() {
  return {
    size: DOORS_CACHE.size,
    urls: Array.from(DOORS_CACHE.keys()),
  };
}

export default function DesignerKitchen({ url, debug = false, debugDownload = false, ...props }) {
  const { scene, materials } = useGLTF(url);

  useAntiShimmer(scene);

  // Використовуємо кешовані двері або створюємо нові
  const doorsData = useMemo(() => {
    const data = createDoorsForScene(scene, url);
    // Додаємо контейнер до сцени якщо він ще не доданий
    if (data.container && data.parent && !data.parent.children.includes(data.container)) {
      data.parent.add(data.container);
    }
    return data;
  }, [scene, url]);

  const onPointerDown = (e) => {
    let node = e.object;
    while (node && !node.name?.startsWith("GlassDoor_")) node = node.parent;
    if (!node) return;
    e.stopPropagation();
    node.userData.open = node.userData.open ? 0 : 1;
  };

  useFrame((_, dt) => {
    const doors = doorsData.doors || [];
    doors.forEach((pivot) => {
      const { open, openRad = Math.PI / 2, axis = "y" } = pivot.userData;
      const target = open ? openRad : 0;
      const cur = pivot.rotation[axis];
      const diff = target - cur;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 5);
      pivot.rotation[axis] = cur + step;
    });
  });

  // Cleanup - просто видаляємо контейнер зі сцени при зміні url
  // Двері залишаються в кеші і можуть бути перевикористані
  useEffect(() => {
    const currentDoorsData = doorsData;
    return () => {
      // При зміні url видаляємо контейнер зі старої сцени
      // але НЕ dispose-имо геометрії - вони залишаються в кеші
      const { container, parent, glassMesh } = currentDoorsData;
      if (container && parent && parent.children.includes(container)) {
        parent.remove(container);
      }
      // Показуємо назад оригінальний glassMesh
      if (glassMesh) {
        glassMesh.visible = true;
      }
    };
  }, [url, doorsData]);

  // Дебаг інформація про кеш дверей
  useEffect(() => {
    if (debug) {
      const stats = getDoorsChacheStats();
      console.log(`%c[DOORS CACHE] Stats`, "color:#10b981;font-weight:600", stats);
    }
  }, [url, debug]);

  useEffect(() => {
    if (!debug && !debugDownload) return;
    const tree = collectSceneTree(scene);
    const meshes = collectMeshes(scene);
    const mats = collectMaterials(materials);

    if (debug) {
      console.groupCollapsed("%c[GLB] Structure", "color:#0ea5e9;font-weight:600");
      console.log("Nodes:", tree.length);
      console.table(tree);
      console.groupCollapsed("Meshes"); console.table(meshes); console.groupEnd();
      console.groupCollapsed("Materials"); console.table(mats); console.groupEnd();
      console.groupEnd();
    }

    if (debugDownload) downloadJSON("glb-inspect.json", { tree, meshes, materials: mats });
  }, [debug, debugDownload, scene, materials]);

  useEffect(() => {
    console.groupCollapsed("[GLB] lights & emissive check");
    scene.traverse((o) => {
      if (o.isLight) {
        console.log("LIGHT:", o.type, o.name, {
          color: `#${o.color?.getHexString?.()}`,
          intensity: o.intensity, distance: o.distance, angle: o.angle,
        });
      } else if (o.isMesh && o.material?.emissive && o.material.emissiveIntensity > 0) {
        console.log("EMISSIVE MESH:", o.name, o.material.name, {
          emissive: `#${o.material.emissive.getHexString?.()}`,
          intensity: o.material.emissiveIntensity,
        });
      }
    });
    console.groupEnd();
  }, [scene]);

  useEffect(() => {
    const isGlassMatName = (name = "") =>
      /glass/i.test(name) || name === "Material__92118" || name === "Material__92119";

    const makeGlass = (mat) => {
      if (!(mat instanceof THREE.MeshPhysicalMaterial)) {
        const baseColor = mat.color ? mat.color.clone() : new THREE.Color(0xffffff);
        const newMat = new THREE.MeshPhysicalMaterial({ color: baseColor });
        newMat.name = mat.name;
        mat.dispose?.();
        return newMat;
      }
      return mat;
    };

    scene.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (!m) return;

      const tryMaterial = (mat) => {
        if (!mat) return mat;
        if (isGlassMatName(mat.name) || /Facade_glass/i.test(o.name)) {
          let g = makeGlass(mat);
          g.metalness = 0.0;
          g.roughness = 0.05;
          g.transmission = 0.98;
          g.ior = 1.5;
          g.thickness = 0.02;
          g.attenuationColor = new THREE.Color(0xffffff);
          g.attenuationDistance = 1.0;
          g.clearcoat = 0.0;
          g.transparent = true;
          g.opacity = 1.0;
          g.envMapIntensity = 1.0;
          g.side = THREE.FrontSide;
          return g;
        }
        return mat;
      };

      if (Array.isArray(m)) {
        o.material = m.map(tryMaterial);
      } else {
        o.material = tryMaterial(m);
      }
    });

    Object.values(materials || {}).forEach((mat) => {
      if (!mat) return;
      if (/fallback Material/i.test(mat.name)) {
        mat.color.set(0x888888);
        mat.metalness = 0.0;
        mat.roughness = 0.8;
      }
    });
  }, [scene, materials]);

  useEffect(() => {
    scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }, [scene]);

  return <primitive object={scene} {...props} onPointerDown={onPointerDown} />;
}

