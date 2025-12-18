"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { MODEL_BY_FACADE } from "@/data/constants";

export default function PreloadModels() {
  useEffect(() => {
    const urls = Object.values(MODEL_BY_FACADE);
    
    // Завантажуємо моделі по черзі з затримкою для оптимізації FPS
    urls.forEach((url, index) => {
      setTimeout(() => {
        useGLTF.preload(url);
      }, index * 500); 
    });
  }, []);

  return null;
}

