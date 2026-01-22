"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

// Smooth theme transition for canvas background
const TRANSITION_DURATION = 0.5; // seconds, matches CSS transition

// CSS "ease" timing function: cubic-bezier(0.25, 0.1, 0.25, 1.0)
function easeInOut(t) {
  // Attempt to match CSS "ease" - fast in middle, slow at ends
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function SmoothBackground({ targetColor, isDark }) {
  const { gl, scene } = useThree();
  const startColor = useRef(new THREE.Color(targetColor));
  const endColor = useRef(new THREE.Color(targetColor));
  const displayColor = useRef(new THREE.Color(targetColor));
  const transitionProgress = useRef(1); // 1 = complete
  
  // Tone mapping exposure animation
  const targetExposure = isDark ? 0.85 : 1.0;
  const startExposure = useRef(targetExposure);
  const endExposure = useRef(targetExposure);
  const currentExposure = useRef(targetExposure);
  const exposureProgress = useRef(1);

  useEffect(() => {
    // When target color changes, start a new transition
    // Capture current displayed color as start point
    startColor.current.copy(displayColor.current);
    endColor.current.set(targetColor);
    transitionProgress.current = 0;
  }, [targetColor]);

  useEffect(() => {
    // Start exposure transition
    startExposure.current = currentExposure.current;
    endExposure.current = targetExposure;
    exposureProgress.current = 0;
  }, [targetExposure]);

  useFrame((_, delta) => {
    // Animate background color
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta / TRANSITION_DURATION);
      const easedProgress = easeInOut(transitionProgress.current);
      displayColor.current.copy(startColor.current).lerp(endColor.current, easedProgress);
      scene.background = displayColor.current;
    }
    
    // Animate tone mapping exposure
    if (exposureProgress.current < 1) {
      exposureProgress.current = Math.min(1, exposureProgress.current + delta / TRANSITION_DURATION);
      const easedProgress = easeInOut(exposureProgress.current);
      currentExposure.current = startExposure.current + (endExposure.current - startExposure.current) * easedProgress;
      gl.toneMappingExposure = currentExposure.current;
    }
  });

  return null;
}

// Smooth floor color transition
function SmoothFloor({ targetColor }) {
  const meshRef = useRef();
  const startColor = useRef(new THREE.Color(targetColor));
  const endColor = useRef(new THREE.Color(targetColor));
  const displayColor = useRef(new THREE.Color(targetColor));
  const transitionProgress = useRef(1);

  useEffect(() => {
    // Capture current displayed color as start point
    startColor.current.copy(displayColor.current);
    endColor.current.set(targetColor);
    transitionProgress.current = 0;
  }, [targetColor]);

  useFrame((_, delta) => {
    if (transitionProgress.current < 1 && meshRef.current) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta / TRANSITION_DURATION);
      const easedProgress = easeInOut(transitionProgress.current);
      displayColor.current.copy(startColor.current).lerp(endColor.current, easedProgress);
      meshRef.current.material.color.copy(displayColor.current);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color={targetColor} roughness={0.92} metalness={0} />
    </mesh>
  );
}

// Smooth ambient light intensity transition
function SmoothAmbientLight({ targetIntensity }) {
  const lightRef = useRef();
  const startIntensity = useRef(targetIntensity);
  const endIntensity = useRef(targetIntensity);
  const currentIntensity = useRef(targetIntensity);
  const transitionProgress = useRef(1);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // First mount - set initial intensity directly
      initialized.current = true;
      return;
    }
    // Start animation on subsequent changes
    startIntensity.current = currentIntensity.current;
    endIntensity.current = targetIntensity;
    transitionProgress.current = 0;
  }, [targetIntensity]);

  // Set initial intensity on mount
  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.intensity = targetIntensity;
      currentIntensity.current = targetIntensity;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (transitionProgress.current < 1 && lightRef.current) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta / TRANSITION_DURATION);
      const easedProgress = easeInOut(transitionProgress.current);
      currentIntensity.current = startIntensity.current + (endIntensity.current - startIntensity.current) * easedProgress;
      lightRef.current.intensity = currentIntensity.current;
    }
  });

  // Don't pass intensity prop - control entirely via ref
  return <ambientLight ref={lightRef} />;
}

// Smooth directional light intensity transition
function SmoothDirectionalLight({ position, targetIntensity, castShadow = false, shadowProps = {} }) {
  const lightRef = useRef();
  const startIntensity = useRef(targetIntensity);
  const endIntensity = useRef(targetIntensity);
  const currentIntensity = useRef(targetIntensity);
  const transitionProgress = useRef(1);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    startIntensity.current = currentIntensity.current;
    endIntensity.current = targetIntensity;
    transitionProgress.current = 0;
  }, [targetIntensity]);

  // Set initial intensity on mount
  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.intensity = targetIntensity;
      currentIntensity.current = targetIntensity;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (transitionProgress.current < 1 && lightRef.current) {
      transitionProgress.current = Math.min(1, transitionProgress.current + delta / TRANSITION_DURATION);
      const easedProgress = easeInOut(transitionProgress.current);
      currentIntensity.current = startIntensity.current + (endIntensity.current - startIntensity.current) * easedProgress;
      lightRef.current.intensity = currentIntensity.current;
    }
  });

  // Don't pass intensity prop - control entirely via ref
  return (
    <directionalLight
      ref={lightRef}
      position={position}
      castShadow={castShadow}
      {...shadowProps}
    />
  );
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

// All available drei Environment presets
const ENV_PRESETS = [
  { id: "studio", label: "Studio", description: "Нейтральне студійне" },
  { id: "apartment", label: "Apartment", description: "Квартира, тепле" },
  { id: "warehouse", label: "Warehouse", description: "Склад, м'яке" },
  { id: "lobby", label: "Lobby", description: "Лобі, збалансоване" },
  { id: "city", label: "City", description: "Місто, урбан" },
  { id: "dawn", label: "Dawn", description: "Світанок, теплі тони" },
  { id: "sunset", label: "Sunset", description: "Захід сонця" },
  { id: "forest", label: "Forest", description: "Ліс, зелені тони" },
  { id: "park", label: "Park", description: "Парк, натуральне" },
  { id: "night", label: "Night", description: "Ніч, темне" },
];

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
  const [envPreset, setEnvPreset] = useState("studio");
  const [showEnvPicker, setShowEnvPicker] = useState(false);
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
          onCreated={({ gl, scene }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = isDark ? 0.85 : 1.0;
            // Set initial background color
            scene.background = new THREE.Color(canvasBg);
          }}
        >
          {/* Smooth background color transition */}
          <SmoothBackground targetColor={canvasBg} isDark={isDark} />
          
          {/* Smooth light transitions */}
          <SmoothAmbientLight targetIntensity={isDark ? 0.5 : 0.4} />
          <SmoothDirectionalLight
            position={[3, 6, 4]}
            targetIntensity={isDark ? 0.9 : 1.1}
            castShadow
            shadowProps={{
              "shadow-normalBias": 0.02,
              "shadow-mapSize-width": 2048,
              "shadow-mapSize-height": 2048,
            }}
          />
          {/* Fill light - animates intensity instead of appearing/disappearing */}
          <SmoothDirectionalLight
            position={[-2, 3, -2]}
            targetIntensity={isDark ? 0.3 : 0}
          />
          {/* Environment for reflections - user-selectable preset */}
          <Environment preset={envPreset} background={false} />

          <OrbitControls
            makeDefault
            minPolarAngle={0.2}
            maxPolarAngle={1.65}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={8}
          />

          {/* Floor with smooth color transition */}
          <SmoothFloor targetColor={canvasFloor} />

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

        {/* Environment preset picker */}
        <div className="absolute right-4 top-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEnvPicker(!showEnvPicker)}
              className="flex items-center gap-2 border border-[var(--sky-border)] bg-[var(--sky-surface)]/90 px-3 py-2 text-xs text-[var(--sky-fg)] backdrop-blur-sm transition hover:bg-[var(--sky-surface)]"
              style={{ borderRadius: 2 }}
            >
              <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <span>{ENV_PRESETS.find(p => p.id === envPreset)?.label || "Environment"}</span>
              <svg className={`h-3 w-3 opacity-60 transition-transform ${showEnvPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showEnvPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEnvPicker(false)} />
                <div
                  className="absolute right-0 top-full z-50 mt-1 max-h-[300px] min-w-[180px] overflow-y-auto border border-[var(--sky-border)] bg-[var(--sky-surface)] p-1 shadow-lg"
                  style={{ borderRadius: 2 }}
                >
                  {ENV_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setEnvPreset(preset.id);
                        setShowEnvPicker(false);
                      }}
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition ${
                        envPreset === preset.id
                          ? "bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                          : "text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
                      }`}
                      style={{ borderRadius: 1 }}
                    >
                      <span className="text-xs font-medium">{preset.label}</span>
                      <span className={`text-[10px] ${envPreset === preset.id ? "opacity-80" : "text-[var(--sky-muted)]"}`}>
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hints overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between text-[10px] tracking-[0.06em] text-[var(--sky-muted2)]">
          <span>Крутіть мишкою для огляду</span>
          <span>Клацніть на дверцята щоб відкрити</span>
        </div>
      </div>
    </div>
  );
}
