"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, OrbitControls, useProgress } from "@react-three/drei";
import * as THREE from "three";

import DesignerKitchen from "@/components/DesignerKitchen";
import { MODEL_BY_FACADE } from "@/data/constants";
import { CARCASS_SETS, FACADE_SETS, TOP_SETS } from "@/data/configuratorOptions";
import { useConfiguratorStore } from "@/stores/useConfiguratorStore";
import { useCart } from "@/contexts/CartContext";
import { getCurrentExchangeRate } from "@/app/actions/checkout";
import { useThemeColors } from "@/hooks/useThemeColors";

import { formatPriceFromMinor } from "@/lib/currency";
import { formatUahFromMinor, convertUsdToUah } from "@/lib/nbu";

// Price formatter (converts from minor units for display)
function formatPrice(minorUnits) {
  return formatPriceFromMinor(minorUnits);
}

// 3D Model Loading overlay
function ModelLoader() {
  const { active, progress, loaded, total } = useProgress();
  
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--sky-bg-alt)]/95 backdrop-blur-sm">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <svg
          className="animate-spin"
          viewBox="0 0 50 50"
          style={{ animation: "spin 1.2s linear infinite" }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--sky-border)"
            strokeWidth="3"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--sky-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 1.26}, 126`}
            style={{ transition: "stroke-dasharray 0.3s ease" }}
          />
        </svg>
      </div>
      
      {/* Progress text */}
      <div className="mt-4 text-center">
        <div className="text-sm font-medium text-[var(--sky-fg)]">
          Завантаження моделі
        </div>
        <div className="mt-1 text-2xl font-light tracking-tight text-[var(--sky-fg)]">
          {Math.round(progress)}%
        </div>
        {total > 0 && (
          <div className="mt-1 text-[10px] text-[var(--sky-muted)]">
            {loaded} / {total} ресурсів
          </div>
        )}
      </div>
    </div>
  );
}

const MODEL_SCALE = [1, 1, 1];
const MODEL_POS = [1.25, 0, 0];

function makeChipStyle(opt) {
  const v = opt?.value;
  if (typeof v === "string" && v.trim().startsWith("#")) {
    return { background: v };
  }
  if (typeof v === "string") {
    return { backgroundImage: `url(${v})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (v && typeof v === "object") {
    const thumb = opt.thumb || v.base || v.diffuse || v.albedo || v.colorMap || null;
    if (typeof thumb === "string") {
      if (thumb.trim().startsWith("#")) return { background: thumb };
      return { backgroundImage: `url(${thumb})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
  }
  return { background: "linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 50%, #e0e0e0 100%)" };
}

export default function KitchenConfigurator({ mode = "embedded", product = null }) {
  const [openSection, setOpenSection] = useState("facade");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const { addToCart, isPending } = useCart();
  const { canvasBg, canvasFloor, isDark } = useThemeColors();

  // Fetch exchange rate for UAH display
  useEffect(() => {
    async function fetchExchangeRate() {
      try {
        const result = await getCurrentExchangeRate();
        if (result.success && result.rate) {
          setExchangeRate(result.rate);
        }
      } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
      }
    }
    fetchExchangeRate();
  }, []);

  const facadeId = useConfiguratorStore((s) => s.facadeId);
  const topId = useConfiguratorStore((s) => s.topId);
  const carcassId = useConfiguratorStore((s) => s.carcassId);
  const setFacadeId = useConfiguratorStore((s) => s.setFacade);
  const setTopId = useConfiguratorStore((s) => s.setTop);
  const setCarcassId = useConfiguratorStore((s) => s.setCarcass);

  const facadeLabel = useMemo(() => FACADE_SETS.find((x) => x.id === facadeId)?.label ?? "", [facadeId]);
  const topLabel = useMemo(() => TOP_SETS.find((x) => x.id === topId)?.label ?? "", [topId]);
  const carcassLabel = useMemo(() => CARCASS_SETS.find((x) => x.id === carcassId)?.label ?? "", [carcassId]);

  const isFullscreen = mode === "fullscreen";

  const sections = [
    { id: "facade", title: "Фасад", summary: facadeLabel, options: FACADE_SETS, value: facadeId, onChange: setFacadeId },
    { id: "top", title: "Стільниця", summary: topLabel, options: TOP_SETS, value: topId, onChange: setTopId },
    { id: "carcass", title: "Корпус", summary: carcassLabel, options: CARCASS_SETS, value: carcassId, onChange: setCarcassId },
  ];

  return (
    <div className={`flex h-full ${isFullscreen ? "flex-row" : "flex-col gap-4 lg:flex-row"}`}>
      {/* Sidebar Panel */}
      <aside
        className={`shrink-0 overflow-y-auto border-[var(--sky-border)] bg-[var(--sky-surface)] ${
          isFullscreen ? "w-[320px] border-r" : "w-full border lg:w-[340px]"
        }`}
        style={{ borderRadius: isFullscreen ? 0 : 3 }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-[var(--sky-muted2)]">
              <span className="h-[1px] w-4 bg-current opacity-50" />
              МАТЕРІАЛИ
            </div>
            <div className="mt-2 text-base font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
              Налаштуйте вигляд
            </div>
          </div>

          {/* Accordion Sections */}
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div
                key={section.id}
                className="mb-2 overflow-hidden border border-[var(--sky-border)] bg-[var(--sky-card-bg)]"
                style={{ borderRadius: 2 }}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 bg-transparent px-4 py-3 text-left transition hover:bg-[var(--sky-bg-alt)]"
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--sky-fg)]">{section.title}</div>
                    {section.summary && (
                      <div className="mt-0.5 truncate text-xs text-[var(--sky-muted)]">{section.summary}</div>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 shrink-0 text-[var(--sky-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-[var(--sky-border)] px-4 py-3">
                      <div className="grid grid-cols-3 gap-2">
                        {section.options.map((o) => {
                          const selected = section.value === o.id;
                          return (
                            <button
                              key={o.id}
                              className={`group flex flex-col items-center gap-2 border p-2.5 transition ${
                                selected
                                  ? "border-[var(--sky-accent)] bg-[var(--sky-bg-alt)]"
                                  : "border-[var(--sky-border)] bg-[var(--sky-card-bg)] hover:border-[var(--sky-muted2)]"
                              }`}
                              style={{ borderRadius: 2 }}
                              onClick={() => section.onChange(o.id)}
                              title={o.label}
                              type="button"
                            >
                              <span
                                className="aspect-[4/3] w-full"
                                style={{
                                  ...makeChipStyle(o),
                                  borderRadius: 1,
                                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                                }}
                              />
                              <span className={`text-center text-[11px] leading-tight ${selected ? "font-medium text-[var(--sky-fg)]" : "text-[var(--sky-muted)]"}`}>
                                {o.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Price & Add to Cart */}
          <div className="mt-6 border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] p-4" style={{ borderRadius: 2 }}>
            {product ? (
              <>
                <div className="flex items-center justify-between text-xs text-[var(--sky-muted)]">
                  <span>Ціна</span>
                  <span className="text-[var(--sky-muted2)]">без монтажу</span>
                </div>
                <div className="mt-2 text-xl font-medium tracking-tight text-[var(--sky-fg)]">
                  ${formatPrice(product.price)}
                </div>
                {exchangeRate && product.price && (
                  <div className="mt-1 text-sm text-[var(--sky-muted)]">
                    ≈ {formatUahFromMinor(convertUsdToUah(product.price, exchangeRate))} ₴
                  </div>
                )}
                <p className="mt-2 text-[10px] text-[var(--sky-muted2)]">
                  *Остаточна сума у гривні визначається за курсом НБУ на дату оформлення замовлення
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setIsAddingToCart(true);
                    // Pass product info for instant optimistic update
                    await addToCart(product.id, 1, {
                      name: product.name,
                      unitPrice: product.price,
                      product: {
                        id: product.id,
                        name: product.name,
                        image: product.image, // Full URL for instant display
                        price: product.price,
                      },
                    });
                    setIsAddingToCart(false);
                  }}
                  disabled={isAddingToCart || isPending}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[var(--sky-accent)] py-2.5 text-xs font-medium tracking-[0.04em] text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50"
                  style={{ borderRadius: 2 }}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Додаємо...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Додати в кошик</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-[var(--sky-muted)]">
                  <span>Попередня оцінка</span>
                  <span className="text-[var(--sky-muted2)]">без монтажу</span>
                </div>
                <div className="mt-2 text-xl font-medium tracking-tight text-[var(--sky-fg)]">від $5 900</div>
                <button
                  type="button"
                  className="mt-4 w-full bg-[var(--sky-accent)] py-2.5 text-xs font-medium tracking-[0.04em] text-[var(--sky-accent-fg)] transition hover:opacity-90"
                  style={{ borderRadius: 2 }}
                >
                  Замовити розрахунок
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 3D Viewport */}
      <div
        className={`relative flex-1 overflow-hidden bg-[var(--sky-bg-alt)] ${isFullscreen ? "" : "min-h-[400px] border border-[var(--sky-border)] lg:min-h-0"}`}
        style={{ borderRadius: isFullscreen ? 0 : 3 }}
      >
        {/* Loading overlay */}
        <ModelLoader />

        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          shadows
          camera={{ position: [3.2, 2.2, 4.0], fov: 32 }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = isDark ? 0.85 : 1.0;
          }}
        >
          <color attach="background" args={[canvasBg]} />
          <ambientLight intensity={isDark ? 0.5 : 0.4} />
          <directionalLight
            position={[3, 6, 4]}
            intensity={isDark ? 0.9 : 1.1}
            castShadow
            shadow-normalBias={0.02}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          {/* Extra fill light for dark theme */}
          {isDark && (
            <directionalLight
              position={[-2, 3, -2]}
              intensity={0.3}
            />
          )}
          <Environment preset={isDark ? "night" : "apartment"} />

          <OrbitControls
            makeDefault
            minPolarAngle={0.2}
            maxPolarAngle={1.65}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={8}
          />

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color={canvasFloor} roughness={0.92} metalness={0} />
          </mesh>

          {/* All models preloaded, toggle visibility for instant switching */}
          <Bounds fit clip observe margin={1.15}>
            <group position={MODEL_POS} scale={MODEL_SCALE}>
              {Object.entries(MODEL_BY_FACADE).map(([id, url]) => (
                <group key={id} visible={id === facadeId}>
                  <DesignerKitchen url={url} debug={false} />
                </group>
              ))}
            </group>
          </Bounds>

          <ContactShadows position={[0, 0.001, 0]} opacity={0.2} width={10} height={10} blur={1.6} far={1.8} />
        </Canvas>

        {/* Hints overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between text-[10px] tracking-[0.06em] text-[var(--sky-muted2)]">
          <span>Крутіть мишкою для огляду</span>
          <span>Клацніть на дверцята щоб відкрити</span>
        </div>
      </div>
    </div>
  );
}
