"use client";

import { create } from "zustand";
import { MODEL_BY_FACADE } from "@/data/constants";

const DEFAULT_FACADE = "graphite";
const DEFAULT_TOP = "white";
const DEFAULT_CARCASS = "carc_white";

export const useConfiguratorStore = create((set, get) => ({
  facadeId: DEFAULT_FACADE,
  topId: DEFAULT_TOP,
  carcassId: DEFAULT_CARCASS,
  debug: true,
  debugDownload: true,
  setFacade: (id) => set({ facadeId: id }),
  setTop: (id) => set({ topId: id }),
  setCarcass: (id) => set({ carcassId: id }),
  toggleDebug: () => set({ debug: !get().debug }),
  toggleDebugDownload: () => set({ debugDownload: !get().debugDownload }),
  modelUrl: () => MODEL_BY_FACADE[get().facadeId] || MODEL_BY_FACADE[DEFAULT_FACADE],
}));

