import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function formatMB(bytes) { return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function bpp(format = THREE.RGBAFormat, type = THREE.UnsignedByteType) {
  const ch =
    format === THREE.RGBAFormat ? 4 :
    format === THREE.RGBFormat  ? 3 :
    format === THREE.LuminanceAlphaFormat ? 2 :
    format === THREE.AlphaFormat || format === THREE.LuminanceFormat ? 1 : 4;
  const bytes = type === THREE.FloatType ? 4 : type === THREE.HalfFloatType ? 2 : 1;
  return ch * bytes;
}
function estimateTextureBytes(tex) {
  if (!tex) return 0;
  if (tex.isCompressedTexture) {
    if (Array.isArray(tex.mipmaps) && tex.mipmaps.length) {
      return tex.mipmaps.reduce((s, m) => s + (m?.data?.byteLength || 0), 0);
    }
    const w = tex.image?.width ?? 0, h = tex.image?.height ?? 0;
    return Math.round(w * h * 0.5 * 1.33);
  }
  const img = tex.image;
  const w = img?.videoWidth || img?.width || 0;
  const h = img?.videoHeight || img?.height || 0;
  if (!w || !h) return 0;
  return Math.round(w * h * bpp(tex.format, tex.type) * 1.33);
}
function estimateGeometryBytes(geom) {
  if (!geom?.isBufferGeometry) return 0;
  let sum = 0;
  for (const k in geom.attributes) sum += geom.attributes[k]?.array?.byteLength || 0;
  if (geom.index) sum += geom.index.array.byteLength || 0;
  return sum;
}

export default function MetricsHUDDom({ three, position = "bottom-right" }) {
  const gl = three?.gl, scene = three?.scene;

  // FPS з власним RAF
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf, last = performance.now(), frames = 0, acc = 0;
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t; frames++; acc += dt;
      if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // метрики GL + підрахунки пам'яті
  const [stats, setStats] = useState({ calls:0, triangles:0, programs:0, texCount:0, geoCount:0, texBytes:0, geoBytes:0 });
  const [gpu, setGpu] = useState({ vendor:"", renderer:"" });

  useEffect(() => {
    if (!gl || !scene) return;
    try {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        setGpu({
          vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
          renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
        });
      }
    } catch {}

    let raf;
    const loop = () => {
      const info = gl.info;
      const textures = new Set();
      const geoms = new Set();
      scene.traverse(o => {
        if (o.geometry?.isBufferGeometry) geoms.add(o.geometry);
        const m = o.material;
        const collect = (mat) => { for (const k in mat) { const v = mat[k]; if (v?.isTexture) textures.add(v); } };
        if (Array.isArray(m)) m.forEach(collect); else if (m) collect(m);
      });
      let texBytes = 0; textures.forEach(t => texBytes += estimateTextureBytes(t));
      let geoBytes = 0; geoms.forEach(g => geoBytes += estimateGeometryBytes(g));

      setStats({
        calls: info.render.calls,
        triangles: info.render.triangles,
        programs: info.programs ? info.programs.length : 0,
        texCount: info.memory.textures,
        geoCount: info.memory.geometries,
        texBytes, geoBytes,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gl, scene]);

  const anchorStyle = useMemo(() => {
    const common = {
      position: "absolute", padding: "10px 12px", borderRadius: 10,
      background: "rgba(17,25,40,.78)", color: "#fff", fontSize: 12, lineHeight: 1.2,
      boxShadow: "0 8px 24px rgba(0,0,0,.25)", backdropFilter: "blur(4px)",
      minWidth: 220, userSelect: "text", zIndex: 50
    };
    switch (position) {
      case "top-left":    return { ...common, top: 12, left: 12 };
      case "top-right":   return { ...common, top: 12, right: 12 };
      case "bottom-left": return { ...common, bottom: 12, left: 12 };
      default:            return { ...common, bottom: 12, right: 12 };
    }
  }, [position]);

  const row = { display:"flex", justifyContent:"space-between", gap:12, margin:"2px 0" };
  const hr  = { border:0, borderTop:"1px solid rgba(255,255,255,.12)", margin:"8px 0" };

  if (!gl || !scene) return null;
  return (
    <div style={anchorStyle}>
      <div style={row}><b>FPS</b><span>{fps}</span></div>
      <div style={row}><b>Draw calls</b><span>{stats.calls}</span></div>
      <div style={row}><b>Triangles</b><span>{stats.triangles.toLocaleString()}</span></div>
      <div style={row}><b>Programs</b><span>{stats.programs}</span></div>
      <hr style={hr}/>
      <div style={row}><b>Textures</b><span>{stats.texCount} • {formatMB(stats.texBytes)}</span></div>
      <div style={row}><b>Geometry</b><span>{stats.geoCount} • {formatMB(stats.geoBytes)}</span></div>
      <hr style={hr}/>
      {gpu.renderer && <div style={row}><b>GPU</b><span>{gpu.renderer}</span></div>}
      {gpu.vendor   && <div style={row}><b>Vendor</b><span>{gpu.vendor}</span></div>}
    </div>
  );
}