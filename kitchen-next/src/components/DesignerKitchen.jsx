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

function makeDoorFromGeometry(geom, baseMaterial, debug = false) {
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
  
  // Дебаг: візуалізація осей обертання
  if (debug) {
    // AxesHelper: червоний = X, зелений = Y, синій = Z
    const axesHelper = new THREE.AxesHelper(0.3);
    pivot.add(axesHelper);
    
    // Додаткова стрілка для поточної осі обертання (Z)
    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), // напрямок Z (вперед-назад)
      new THREE.Vector3(0, 0, 0), // початок
      0.4, // довжина
      0xffff00, // жовтий колір для виділення
      0.1, // довжина голівки
      0.05 // ширина голівки
    );
    pivot.add(arrowHelper);
  }
  
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

// Кеш контейнерів дверей для кожної моделі (повний кеш)
const DOORS_CACHE = new Map();

// Helper функція для створення дверей для сцени
function createDoorsForScene(scene, url, debug = false) {
  const glassMesh = scene.getObjectByName("Facade_glass_1");
  if (!glassMesh || !glassMesh.isMesh) {
    return { doors: [], container: null, parent: null };
  }
  
  // Ховаємо тільки якщо ще не прихований (оптимізація для кешованих сцен)
  if (glassMesh.visible) {
    glassMesh.visible = false;
  }
  
  const parent = glassMesh.parent || scene;

  // Перевіряємо кеш - повертаємо існуючий контейнер
  if (DOORS_CACHE.has(url)) {
    const cached = DOORS_CACHE.get(url);
    if (debug) console.log(`♻️ Використано кеш для ${url.split('/').pop()}`);
    return { ...cached, parent };
  }

  // Створюємо новий контейнер тільки якщо немає в кеші
  if (debug) console.log(`🆕 Створюємо нові двері для ${url.split('/').pop()}`);
  const parts = splitConnectedComponents(glassMesh.geometry);
  const container = new THREE.Group();
  container.name = "GlassDoorsRoot";
  container.position.copy(glassMesh.position);
  container.quaternion.copy(glassMesh.quaternion);
  container.scale.copy(glassMesh.scale);

  const arr = [];
  for (let i = 0; i < parts.length; i++) {
    const { pivot, mesh } = makeDoorFromGeometry(parts[i], glassMesh.material, debug);
    pivot.name = `GlassDoor_${i + 1}`;
    pivot.userData = { open: 0, openRad: -Math.PI / 2, axis: "z" };
    container.add(pivot);
    arr.push(pivot);
  }

  // Зберігаємо в кеш
  const doorsData = { doors: arr, container };
  DOORS_CACHE.set(url, doorsData);

  return { ...doorsData, parent };
}

// Експортна функція для очистки кешу дверей
export function clearDoorsCache(url) {
  if (url) {
    const cached = DOORS_CACHE.get(url);
    if (cached) {
      cached.container?.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose?.());
          } else {
            obj.material?.dispose();
          }
        }
      });
      DOORS_CACHE.delete(url);
    }
  } else {
    DOORS_CACHE.forEach((cached) => {
      cached.container?.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose?.());
          } else {
            obj.material?.dispose();
          }
        }
      });
    });
    DOORS_CACHE.clear();
  }
}

// Експортна функція для отримання статистики кешу
export function getDoorsCacheStats() {
  const stats = {};
  DOORS_CACHE.forEach((cached, url) => {
    stats[url] = cached.doors.length;
  });
  return {
    size: DOORS_CACHE.size,
    urls: Array.from(DOORS_CACHE.keys()),
    doorsPerUrl: stats,
  };
}

export default function DesignerKitchen({ url, debug = false, debugDownload = false, ...props }) {
  const { scene, materials } = useGLTF(url);

  useAntiShimmer(scene);

  // Використовуємо кешовані двері або створюємо нові (БЕЗ додавання до сцени)
  const doorsData = useMemo(() => {
    return createDoorsForScene(scene, url, debug);
  }, [scene, url, debug]);

  // Додаємо контейнер до parent (glassMesh.parent)
  useEffect(() => {
    const { container, parent } = doorsData;
    if (!container || !parent) return;

    // Додаємо контейнер тільки якщо його ще немає
    if (!parent.children.includes(container)) {
      parent.add(container);
    }
    
    // Не видаляємо контейнер в cleanup - він залишається в кешованій сцені
    // Це нормально, бо при зміні кольору ми переключаємося на іншу сцену
  }, [doorsData, url]);

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
      const { open, openRad = -Math.PI / 2, axis = "z" } = pivot.userData;
      const target = open ? openRad : 0;
      const cur = pivot.rotation[axis];
      const diff = target - cur;
      
      // Оптимізація: пропускаємо якщо вже на місці
      if (Math.abs(diff) < 0.001) return;
      
      const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 5);
      pivot.rotation[axis] = cur + step;
    });
  });



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
    // Перевіряємо чи сцена вже була оброблена
    if (scene.userData.materialsProcessed) return;
    
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
    
    // Позначаємо що сцена вже оброблена
    scene.userData.materialsProcessed = true;
  }, [scene, materials]);

  useEffect(() => {
    if (scene.userData.shadowsProcessed) return;
    scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.userData.shadowsProcessed = true;
  }, [scene]);

  // Дебаг: додаємо глобальний AxesHelper до сцени
  useEffect(() => {
    if (!debug) return;
    
    const globalAxesHelper = new THREE.AxesHelper(2);
    globalAxesHelper.name = "GlobalAxesHelper";
    scene.add(globalAxesHelper);
    
    return () => {
      const helper = scene.getObjectByName("GlobalAxesHelper");
      if (helper) scene.remove(helper);
    };
  }, [scene, debug]);

  return <primitive object={scene} {...props} onPointerDown={onPointerDown} />;
}

