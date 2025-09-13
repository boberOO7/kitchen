import { MODULE_CATALOG } from "../data/constants";

export function computePlan(modules, targetLength) {
  const fixedWidth = modules.reduce((s, m) => s + (m.isFiller ? 0 : m.width), 0);
  const delta = Math.max(0, targetLength - fixedWidth);

  const maxChunk = 0.08; // 8 cm per filler
  const fillerCount = Math.ceil(delta / maxChunk);
  const fillers = [];
  if (delta > 0) {
    for (let i = 0; i < fillerCount; i++) {
      const remaining = delta - i * maxChunk;
      const w = Math.min(maxChunk, remaining);
      fillers.push({ ...MODULE_CATALOG.find(x => x.id === "filler"), width: w, name: `Filler ${Math.round(w*100)}cm` });
    }
  }
  const lineup = [...modules.filter(m => !m.isFiller), ...fillers];
  const total = lineup.reduce((s, m) => s + m.width, 0);
  return { lineup, total, delta };
}

export const snap = (x, step=0.1) => Math.round(x / step) * step;
export const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
