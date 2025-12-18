"use client";

import KitchenConfigurator from "@/components/KitchenConfigurator";
import PreloadModels from "@/components/PreloadModels";

export default function ConfiguratorPage() {
  return (
    <>
      <PreloadModels />

      {/* Full-screen configurator */}
      <section className="flex flex-col" style={{ height: "calc(100dvh - 57px)" }}>
        {/* Compact header */}
        <div className="shrink-0 border-b border-[var(--sky-border)] bg-[var(--sky-surface)] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
                3D Конфігуратор
              </h1>
              <p className="mt-0.5 text-xs text-[var(--sky-muted)]">
                Оберіть матеріали та подивіться результат в реальному часі
              </p>
            </div>
            <div className="hidden text-right text-xs text-[var(--sky-muted2)] sm:block">
              Крутіть мишкою · Клацніть на дверцята
            </div>
          </div>
        </div>

        {/* Configurator takes remaining space */}
        <div className="min-h-0 flex-1">
          <KitchenConfigurator mode="fullscreen" />
        </div>
      </section>
    </>
  );
}

