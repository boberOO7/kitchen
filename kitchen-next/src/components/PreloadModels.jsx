"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { MODEL_BY_FACADE } from "@/data/constants";

/**
 * Preload всі GLB моделі при монтуванні компонента
 * Це забезпечує миттєве перемикання між варіантами кухні
 */
export default function PreloadModels() {
  useEffect(() => {
    // Preload всі моделі з MODEL_BY_FACADE
    Object.values(MODEL_BY_FACADE).forEach((url) => {
      useGLTF.preload(url);
    });
  }, []);

  return null; // Цей компонент не рендерить нічого
}

