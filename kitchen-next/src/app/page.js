"use client";

import KitchenConfigurator from "@/components/KitchenConfigurator";
import PreloadModels from "@/components/PreloadModels";

export default function Home() {
  return (
    <>
      <PreloadModels />
      <KitchenConfigurator />
    </>
  );
}
