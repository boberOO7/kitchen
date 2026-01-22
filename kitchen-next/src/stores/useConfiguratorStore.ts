"use client";

import { create } from "zustand";
import { MODEL_BY_FACADE } from "@/data/constants";
import { CONFIG_DEFAULTS, CONFIG_ALLOWED } from "@/data/configuratorOptions";

export const useConfiguratorStore = create((set, get) => ({
  facadeId: CONFIG_DEFAULTS.facadeId,
  topId: CONFIG_DEFAULTS.topId,
  carcassId: CONFIG_DEFAULTS.carcassId,
  debug: true,
  debugDownload: true,
  setFacade: (id) => set({ facadeId: id }),
  setTop: (id) => set({ topId: id }),
  setCarcass: (id) => set({ carcassId: id }),
  setFromUrl: ({ facadeId, topId, carcassId }) =>
    set((state) => ({
      facadeId: facadeId && CONFIG_ALLOWED.facadeId.has(facadeId) ? facadeId : state.facadeId,
      topId: topId && CONFIG_ALLOWED.topId.has(topId) ? topId : state.topId,
      carcassId: carcassId && CONFIG_ALLOWED.carcassId.has(carcassId) ? carcassId : state.carcassId,
    })),
  reset: () => set({ ...CONFIG_DEFAULTS }),
  toggleDebug: () => set({ debug: !get().debug }),
  toggleDebugDownload: () => set({ debugDownload: !get().debugDownload }),
  modelUrl: () =>
    MODEL_BY_FACADE[get().facadeId] || MODEL_BY_FACADE[CONFIG_DEFAULTS.facadeId],
}));

