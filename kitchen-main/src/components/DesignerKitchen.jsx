import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useAntiShimmer } from "./useAntiShimer";

// --- utils: розбити BufferGeometry на "острівці" (connected components)
function splitConnectedComponents(geometry) {
  const index = geometry.index;
  const pos = geometry.attributes.position;
  const vertCount = pos.count;
  const faceCount = (index ? index.count : vertCount) / 3;

  // побудуємо граф суміжності "вершина -> трикутники"
  const triVerts = (t) => {
    if (index) {
      return [index.getX(3*t), index.getX(3*t+1), index.getX(3*t+2)];
    } else {
      return [3*t, 3*t+1, 3*t+2];
    }
  };

  const vertToTris = Array.from({ length: vertCount }, () => []);
  for (let t = 0; t < faceCount; t++) {
    const [a,b,c] = triVerts(t);
    vertToTris[a].push(t); vertToTris[b].push(t); vertToTris[c].push(t);
  }

  // BFS по трикутниках
  const visited = new Uint8Array(faceCount);
  const components = [];
  const deque = [];

  for (let start=0; start<faceCount; start++) {
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

  // зібрати геометрію для кожного компоненту
  const out = [];
  for (const faces of components) {
    const idx = [];
    for (const t of faces) {
      const [a,b,c] = triVerts(t);
      idx.push(a,b,c);
    }
    // створимо компактний гео з «reindex»
    const remap = new Map(); let next=0;
    const compactIndex = new Uint32Array(idx.length);
    for (let i=0;i<idx.length;i++){
      const v = idx[i];
      if (!remap.has(v)) remap.set(v, next++);
      compactIndex[i] = remap.get(v);
    }
    const newPos = new Float32Array(next*3);
    remap.forEach((to, from) => {
      newPos[3*to+0] = pos.getX(from);
      newPos[3*to+1] = pos.getY(from);
      newPos[3*to+2] = pos.getZ(from);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(newPos,3));
    g.setIndex(new THREE.BufferAttribute(compactIndex,1));
    if (geometry.attributes.normal) {
      // перерахувати краще, але на старт — let Three compute:
      g.computeVertexNormals();
    }
    g.computeBoundingBox();
    out.push(g);
  }

  return out;
}

// створити «двері» з правильним півотом (на мінімальному X)
function makeDoorFromGeometry(geom, baseMaterial) {
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  const hingeX = bb.min.x;                       // кромка завіси (ліва)
  const centerY = (bb.min.y + bb.max.y) / 2;
  const centerZ = (bb.min.z + bb.max.z) / 2;

  // група-півот
  const pivot = new THREE.Group();
  pivot.position.set(hingeX, centerY, centerZ);

  // сам меш «зсунемо» так, щоб його локальний центр збігся з pivot:
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

export default function DesignerKitchen({ url, debug = false, debugDownload = false, ...props }) {
  const { scene, materials } = useGLTF(url);
  useAntiShimmer(scene);

  // 1) зберемо дверцята зі скляного фасаду
  const doorsData = useMemo(() => {
    const arr = [];
    let container = null;
    let parent = null;

    // знайдемо вузол зі **всіма скляними площинами** (це не окремі двері)…
    const glassMesh = scene.getObjectByName("Facade_glass_1"); // MeshPhysicalMaterial / MeshStandardMaterial
    if (!glassMesh || !glassMesh.isMesh) return { doors: arr, container: null, parent: null };

    // розбиваємо на компоненти (припущення: кожна дверця — окремий острівець)
    const parts = splitConnectedComponents(glassMesh.geometry);

    // підготуємо контейнер, що копіює локальні трансформації скла
    parent = glassMesh.parent || scene;
    container = new THREE.Group();
    container.name = "GlassDoorsRoot";
    container.position.copy(glassMesh.position);
    container.quaternion.copy(glassMesh.quaternion);
    container.scale.copy(glassMesh.scale);

    // збудуємо окремі двері (вісь обертання — навколо Y, півот на мінімальному X)
    for (let i=0;i<parts.length;i++){
      const { pivot, mesh } = makeDoorFromGeometry(parts[i], glassMesh.material);
      pivot.name = `GlassDoor_${i+1}`;
      // за замовчанням закрито
      pivot.userData = { open: 0, openRad: Math.PI/2, axis: "y" };
      arr.push(pivot);
    }

    // сховаємо первинний «суцільний» меш, щоб не дублювався
    glassMesh.visible = false;

    // додамо двері в ту саму батьківську групу, де був glassMesh
    arr.forEach(p => container.add(p));
    parent.add(container);

    return { doors: arr, container, parent };
  }, [scene]);

  // 3) клік: відкриваємо лише ту дверку, по якій клацнули
  const onPointerDown = (e) => {
    // шукаємо серед дверей (pivot або їхній дочірній mesh)
    let node = e.object;
    while (node && !node.name?.startsWith("GlassDoor_")) node = node.parent;
    if (!node) return;

    e.stopPropagation();
    node.userData.open = node.userData.open ? 0 : 1;
  };

  // 4) анімація
  useFrame((_, dt) => {
    const doors = doorsData.doors || [];
    doors.forEach(pivot => {
      const { open, openRad= Math.PI/2, axis="y" } = pivot.userData;
      const target = open ? openRad : 0;
      const cur = pivot.rotation[axis];
      const diff = target - cur;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), dt * 5);
      pivot.rotation[axis] = cur + step;
    });
  });

  // cleanup для дверей (щоб не дублювались при перемонтуванні)
  useEffect(() => {
    return () => {
      const { container, parent } = doorsData;
      if (container && parent) {
        container.traverse(o => {
          if (o.isMesh) {
            o.geometry?.dispose?.();
            if (o.material?.dispose) o.material.dispose();
          }
        });
        parent.remove(container);
      }
    };
  }, [doorsData]);

  // debug dump/збереження структури GLB
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

    if (debugDownload) {
      downloadJSON("glb-inspect.json", { tree, meshes, materials: mats });
    }
  }, [debug, debugDownload, scene, materials]);

  useEffect(() => {
    console.groupCollapsed("[GLB] lights & emissive check");
    scene.traverse(o => {
      if (o.isLight) {
        console.log("LIGHT:", o.type, o.name, {
          color: `#${o.color?.getHexString?.()}`,
          intensity: o.intensity, distance: o.distance, angle: o.angle
        });
      } else if (o.isMesh && o.material?.emissive && o.material.emissiveIntensity > 0) {
        console.log("EMISSIVE MESH:", o.name, o.material.name, {
          emissive: `#${o.material.emissive.getHexString?.()}`, 
          intensity: o.material.emissiveIntensity
        });
      }
    });
    console.groupEnd();
  }, [scene]);

  useEffect(() => {
    // 1) Включимо тіні всюди (не обов’язково)
    scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }});

    // 2) Патч скла: шукаємо матеріали/об’єкти з "glass" у назві, або конкретні імена
    const isGlassMatName = (name="") =>
      /glass/i.test(name) || name === "Material__92118" || name === "Material__92119";

    // перетворення матеріалу на "скло"
    const makeGlass = (mat) => {
      // якщо вже Physical — просто правимо параметри
      if (!(mat instanceof THREE.MeshPhysicalMaterial)) {
        // заміна на Physical, зберігаємо колір/назву
        const baseColor = mat.color ? mat.color.clone() : new THREE.Color(0xffffff);
        const newMat = new THREE.MeshPhysicalMaterial({ color: baseColor });
        newMat.name = mat.name;
        mat.dispose?.();
        return newMat;
      }
      return mat;
    };

    // обійдемо всі меші та відредагуємо матеріали, що схожі на скло
    scene.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (!m) return;

      const tryMaterial = (mat) => {
        if (!mat) return mat;
        if (isGlassMatName(mat.name) || /Facade_glass/i.test(o.name)) {
          let g = makeGlass(mat);
          // Ключ для скла:
          g.metalness = 0.0;       // скло — не метал
          g.roughness = 0.05;      // трохи мікрошорсткість
          g.transmission = 0.98;   // головне: прозорість через фізичну трансмісію
          g.ior = 1.5;             // показник заломлення скла
          g.thickness = 0.02;      // в метрах; впливає на заломлення/поглинання
          g.attenuationColor = new THREE.Color(0xffffff);
          g.attenuationDistance = 1.0; // чим менше — тим сильніше забарвлення товщиною
          g.clearcoat = 0.0;       // необов’язково
          g.transparent = true;    // щоб працювали правильно бленди
          g.opacity = 1.0;         // прозорість контролює transmission
          g.envMapIntensity = 1.0; // трохи «життя» від HDRI
          g.side = THREE.FrontSide; // зазвичай досить одностороннього
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

    // 3) (не обов’язково) підправимо "fallback Material", щоб не був «чорним металом»
    Object.values(materials || {}).forEach(mat => {
      if (!mat) return;
      if (/fallback Material/i.test(mat.name)) {
        mat.color.set(0x888888);
        mat.metalness = 0.0;
        mat.roughness = 0.8;
      }
    });
  }, [scene, materials]);

  return <primitive object={scene} {...props} onPointerDown={onPointerDown} />;
}
