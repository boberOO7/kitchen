"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/animations/AnimateOnScroll";
import PreloadModels from "@/components/PreloadModels";
import { track } from "@/lib/analytics";

// Pixabay CDN video URL (free, allows hotlinking) - modern architecture interior
const HERO_VIDEO_URL = "https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4";

// Fixed price formatter to avoid hydration mismatch (server vs client locale)
function formatPrice(price) {
  return new Intl.NumberFormat("uk-UA").format(price);
}

export default function HomeContent({ products }) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  // Listen for video toggle changes from ThemeToggle
  useEffect(() => {
    // Check initial value from localStorage
    try {
      const stored = localStorage.getItem("sky-video");
      if (stored !== null) {
        setVideoEnabled(stored === "true");
      }
    } catch {}

    // Listen for changes
    const handler = (e) => setVideoEnabled(e.detail);
    window.addEventListener("sky-video-change", handler);
    return () => window.removeEventListener("sky-video-change", handler);
  }, []);

  return (
    <>
      <PreloadModels />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION WITH VIDEO BACKGROUND
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Video Background (conditional) */}
        {videoEnabled ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          /* Solid color background fallback (original design) */
          <div 
            className="absolute inset-0 bg-[var(--sky-hero-bg)]"
            aria-hidden="true"
          />
        )}

        {/* Dark Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Geometric accent line */}
        <div className="absolute left-0 top-0 z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 z-10 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 mx-auto max-w-[1200px] px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <AnimateOnScroll variant="fadeUp" delay={0}>
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-white/70">
                <span className="h-[1px] w-8 bg-current opacity-50" />
                SKY KITCHENS
              </div>
            </AnimateOnScroll>

            {/* Headline */}
            <AnimateOnScroll variant="fadeUp" delay={0.1}>
              <h1 className="mt-6 text-4xl font-light leading-[1.1] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
                Мінімалізм,
                <br />
                <span className="font-normal">що виглядає дорого.</span>
              </h1>
            </AnimateOnScroll>

            {/* Subline */}
            <AnimateOnScroll variant="fadeUp" delay={0.2}>
              <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-white/75 sm:text-lg">
                Оберіть фасад, стільницю та корпус у 3D-конфігураторі — і отримайте
                точний розрахунок. Далі — заміри, проєкт, виробництво.
              </p>
            </AnimateOnScroll>

            {/* CTAs */}
            <AnimateOnScroll variant="fadeUp" delay={0.3}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/configurator"
                  onClick={() => track("cta_configurator_click", { source: "home_hero_primary" })}
                  className="inline-flex items-center justify-center bg-white px-6 py-3 text-sm font-medium tracking-[0.02em] text-black transition hover:bg-white/90"
                  style={{ borderRadius: 2 }}
                  data-cursor-magnetic
                >
                  Запустити конфігуратор
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center justify-center border border-white/30 px-6 py-3 text-sm font-medium tracking-[0.02em] text-white transition hover:border-white/50 hover:bg-white/10"
                  style={{ borderRadius: 2 }}
                  data-cursor-magnetic
                >
                  Переглянути колекції
                </Link>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Stats row */}
          <StaggerContainer staggerDelay={0.1} className="mt-16 grid grid-cols-3 gap-px border-t border-white/15 pt-8 sm:mt-20">
            {[
              { value: "5–8", unit: "тижнів", label: "виробництво" },
              { value: "10", unit: "років", label: "гарантія фурнітури" },
              { value: "100%", unit: "", label: "під ключ" },
            ].map((stat, i) => (
              <StaggerItem key={i} variant="fadeUp">
                <div className="text-white">
                  <div className="text-2xl font-light tracking-tight sm:text-3xl">
                    {stat.value}
                    <span className="text-lg font-normal text-white/60">
                      {stat.unit && ` ${stat.unit}`}
                    </span>
                  </div>
                  <div className="mt-1 text-xs tracking-[0.08em] text-white/60">
                    {stat.label}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Bottom gradient fade to content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-[var(--sky-bg)] to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          COLLECTIONS SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[var(--sky-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Section header — with animation */}
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="text-xs font-medium tracking-[0.25em] text-[var(--sky-muted2)]">
                  COLLECTIONS
                </div>
                <h2 className="mt-2 text-2xl font-light tracking-[-0.01em] text-[var(--sky-fg)] sm:text-3xl">
                  Колекції <span className="font-normal">SKY</span>
                </h2>
              </div>
              <Link
                className="text-sm text-[var(--sky-muted)] transition hover:text-[var(--sky-fg)]"
                href="/catalog"
                data-cursor-magnetic
              >
                Увесь каталог →
              </Link>
            </div>
          </AnimateOnScroll>

          {/* Product cards — staggered animation */}
          <StaggerContainer staggerDelay={0.08} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <StaggerItem key={p.slug} variant="fadeUp">
                <Link
                  href="/configurator"
                  className="group relative flex h-full flex-col overflow-hidden border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] shadow-[var(--sky-shadow)] transition-shadow duration-300 hover:shadow-lg"
                  style={{ borderRadius: 3 }}
                  data-cursor-magnetic
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sky-bg-alt)]">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Price badge */}
                    <div
                      className="absolute right-3 top-3 bg-[var(--sky-surface)]/90 px-2.5 py-1 text-xs font-medium tracking-[0.04em] text-[var(--sky-fg)] backdrop-blur-sm"
                      style={{ borderRadius: 2 }}
                    >
                      від ${formatPrice(p.priceFrom)}
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/20">
                      <span className="translate-y-4 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Налаштувати в 3D →
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <h3 className="text-lg font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
                      {p.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--sky-muted)]">
                      {p.tagline}
                    </p>

                    {/* Tags */}
                    {p.highlights.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {p.highlights.slice(0, 3).map((h) => (
                          <span
                            key={h}
                            className="border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] px-2 py-0.5 text-[11px] text-[var(--sky-muted)]"
                            style={{ borderRadius: 1 }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MATERIALS SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="materials" className="bg-[var(--sky-bg-alt)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Text content — with animation */}
            <AnimateOnScroll variant="fadeRight">
              <div>
                <div className="text-xs font-medium tracking-[0.25em] text-[var(--sky-muted2)]">
                  MATERIALS
                </div>
                <h2 className="mt-2 text-2xl font-light tracking-[-0.01em] text-[var(--sky-fg)] sm:text-3xl">
                  Палітра <span className="font-normal">якості</span>
                </h2>
                <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--sky-muted)]">
                  Ми підбираємо матеріали так, щоб кухня виглядала мінімалістично, але дорого:
                  матові та глянцеві фасади, камʼяні стільниці, спокійні кольори, бездоганні стики.
                </p>

                <Link
                  href="/configurator"
                  className="mt-8 inline-flex items-center gap-2 bg-[var(--sky-accent)] px-5 py-2.5 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
                  style={{ borderRadius: 2 }}
                  data-cursor-magnetic
                >
                  Спробувати в конфігураторі
                  <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </AnimateOnScroll>

            {/* Material swatches — staggered animation */}
            <StaggerContainer staggerDelay={0.06} className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { name: "Graphite", color: "#2c2f33" },
                { name: "Warm Oak", color: "#caa472" },
                { name: "Snow", color: "#f4f5f6" },
                { name: "Slate", color: "#1d1f22" },
                { name: "Champagne", color: "#d4a850" },
                { name: "Stone", color: "#c8ccd0" },
              ].map((s) => (
                <StaggerItem key={s.name} variant="scale">
                  <div
                    className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-3 shadow-[var(--sky-shadow)] transition hover:shadow-md"
                    style={{ borderRadius: 2 }}
                  >
                    <div
                      className="aspect-[4/3]"
                      style={{
                        background: s.color,
                        borderRadius: 1,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                      }}
                    />
                    <div className="mt-2.5 text-xs font-medium text-[var(--sky-fg)]">
                      {s.name}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW WE WORK SECTION (TIMELINE)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--sky-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Section header */}
          <AnimateOnScroll variant="fadeUp">
            <div className="text-center">
              <div className="text-xs font-medium tracking-[0.25em] text-[var(--sky-muted2)]">
                PROCESS
              </div>
              <h2 className="mt-2 text-2xl font-light tracking-[-0.01em] text-[var(--sky-fg)] sm:text-3xl">
                Як ми <span className="font-normal">працюємо</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--sky-muted)]">
                Від ідеї до готової кухні — чіткий процес без сюрпризів
              </p>
            </div>
          </AnimateOnScroll>

          {/* Timeline */}
          <div className="mt-16">
            {/* Desktop: Horizontal timeline */}
            <div className="hidden lg:block">
              <StaggerContainer staggerDelay={0.15} className="relative">
                {/* Connecting line */}
                <div className="absolute left-0 right-0 top-10 h-[2px] bg-[var(--sky-border)]" />
                
                <div className="grid grid-cols-4 gap-6">
                  {[
                    {
                      step: "01",
                      title: "Заміри",
                      duration: "1–2 дні",
                      description: "Безкоштовний виїзд майстра для точних замірів приміщення",
                      icon: (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                      ),
                    },
                    {
                      step: "02",
                      title: "Проєкт",
                      duration: "3–5 днів",
                      description: "3D-візуалізація, технічна специфікація та точний кошторис",
                      icon: (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ),
                    },
                    {
                      step: "03",
                      title: "Виробництво",
                      duration: "5–8 тижнів",
                      description: "Власне виробництво з контролем якості на кожному етапі",
                      icon: (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                      ),
                    },
                    {
                      step: "04",
                      title: "Монтаж",
                      duration: "1–3 дні",
                      description: "Професійна установка під ключ з прибиранням після робіт",
                      icon: (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      ),
                    },
                  ].map((item, i) => (
                    <StaggerItem key={item.step} variant="fadeUp">
                      <div className="relative text-center">
                        {/* Icon circle */}
                        <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center border-2 border-[var(--sky-accent)] bg-[var(--sky-surface)] text-[var(--sky-accent)]" style={{ borderRadius: "50%" }}>
                          {item.icon}
                        </div>
                        
                        {/* Step number */}
                        <div className="mt-5 text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
                          {item.step}
                        </div>
                        
                        {/* Title */}
                        <h3 className="mt-2 text-lg font-medium text-[var(--sky-fg)]">
                          {item.title}
                        </h3>
                        
                        {/* Duration badge */}
                        <div className="mt-2 inline-block border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--sky-muted)]" style={{ borderRadius: 2 }}>
                          {item.duration}
                        </div>
                        
                        {/* Description */}
                        <p className="mt-3 text-sm leading-relaxed text-[var(--sky-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            </div>

            {/* Mobile: Vertical timeline */}
            <div className="lg:hidden">
              <StaggerContainer staggerDelay={0.1} className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute bottom-0 left-3 top-0 w-[2px] bg-[var(--sky-border)]" />
                
                <div className="space-y-10">
                  {[
                    {
                      step: "01",
                      title: "Заміри",
                      duration: "1–2 дні",
                      description: "Безкоштовний виїзд майстра для точних замірів приміщення",
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                      ),
                    },
                    {
                      step: "02",
                      title: "Проєкт",
                      duration: "3–5 днів",
                      description: "3D-візуалізація, технічна специфікація та точний кошторис",
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ),
                    },
                    {
                      step: "03",
                      title: "Виробництво",
                      duration: "5–8 тижнів",
                      description: "Власне виробництво з контролем якості на кожному етапі",
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                      ),
                    },
                    {
                      step: "04",
                      title: "Монтаж",
                      duration: "1–3 дні",
                      description: "Професійна установка під ключ з прибиранням після робіт",
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      ),
                    },
                  ].map((item) => (
                    <StaggerItem key={item.step} variant="fadeUp">
                      <div className="relative">
                        {/* Icon dot */}
                        <div className="absolute -left-8 flex h-6 w-6 items-center justify-center border border-[var(--sky-accent)] bg-[var(--sky-surface)] text-[var(--sky-accent)]" style={{ borderRadius: "50%" }}>
                          {item.icon}
                        </div>
                        
                        {/* Content */}
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
                              {item.step}
                            </span>
                            <span className="border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] px-2 py-0.5 text-[10px] font-medium text-[var(--sky-muted)]" style={{ borderRadius: 2 }}>
                              {item.duration}
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-base font-medium text-[var(--sky-fg)]">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[var(--sky-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--sky-bg-alt)] py-20 sm:py-28">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6">
          {/* Section header */}
          <AnimateOnScroll variant="fadeUp">
            <div className="text-center">
              <div className="text-xs font-medium tracking-[0.25em] text-[var(--sky-muted2)]">
                FAQ
              </div>
              <h2 className="mt-2 text-2xl font-light tracking-[-0.01em] text-[var(--sky-fg)] sm:text-3xl">
                <span className="font-normal">Часті питання</span>
              </h2>
            </div>
          </AnimateOnScroll>

          {/* Accordion */}
          <StaggerContainer staggerDelay={0.08} className="mt-12 space-y-3">
            {[
              {
                id: "price",
                question: "Скільки коштує кухня SKY?",
                answer: "Вартість залежить від розміру, матеріалів та комплектації. Компактні рішення починаються від €4,200, стандартні кухні — від €5,900, преміум-композиції з індивідуальними матеріалами — від €9,800. Точну ціну ви отримаєте після замірів та затвердження проєкту.",
              },
              {
                id: "time",
                question: "Який термін виготовлення?",
                answer: "Стандартний термін виробництва — 5-8 тижнів від моменту затвердження проєкту та внесення передоплати. Термін може змінюватись залежно від складності замовлення та завантаженості виробництва.",
              },
              {
                id: "warranty",
                question: "Чи є гарантія?",
                answer: "Так, ми надаємо 2 роки гарантії на меблі та 10 років на фурнітуру Blum/Hettich. Гарантія покриває виробничі дефекти та несправності фурнітури при правильній експлуатації.",
              },
              {
                id: "changes",
                question: "Чи можна змінити проєкт після замовлення?",
                answer: "Так, зміни можливі до початку виробництва — безкоштовно. Після запуску у виробництво зміни можливі лише за додаткову оплату і можуть вплинути на термін виготовлення.",
              },
              {
                id: "payment",
                question: "Як відбувається оплата?",
                answer: "Оплата здійснюється у два етапи: 50% передоплата після затвердження проєкту, решта 50% — після завершення монтажу. Приймаємо безготівкові перекази та готівку.",
              },
              {
                id: "designers",
                question: "Чи працюєте ви з дизайнерами інтер'єру?",
                answer: "Так, ми активно співпрацюємо з дизайнерами та архітекторами. Для партнерів діють спеціальні умови: знижки, пріоритетне виробництво та технічна підтримка проєктів. Зв'яжіться з нами для деталей.",
              },
            ].map((item) => (
              <StaggerItem key={item.id} variant="fadeUp">
                <div
                  className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] shadow-[var(--sky-shadow)] transition-shadow hover:shadow-md"
                  style={{ borderRadius: 3 }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    data-cursor-magnetic
                  >
                    <span className="text-sm font-medium text-[var(--sky-fg)] sm:text-base">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] text-[var(--sky-muted)] transition-transform duration-300 ${
                        openFaq === item.id ? "rotate-45" : ""
                      }`}
                      style={{ borderRadius: 2 }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  
                  {/* Collapsible content */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openFaq === item.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[var(--sky-border)] px-5 pb-5 pt-4">
                        <p className="text-sm leading-relaxed text-[var(--sky-muted)]">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Contact prompt */}
          <AnimateOnScroll variant="fadeUp" delay={0.3}>
            <p className="mt-10 text-center text-sm text-[var(--sky-muted)]">
              Не знайшли відповідь?{" "}
              <a href="tel:+380XXXXXXXXX" className="font-medium text-[var(--sky-accent)] hover:underline" data-cursor-magnetic>
                Зателефонуйте нам
              </a>{" "}
              або{" "}
              <Link
                href="/configurator"
                onClick={() => track("cta_configurator_click", { source: "home_faq_prompt" })}
                className="font-medium text-[var(--sky-accent)] hover:underline"
                data-cursor-magnetic
              >
                залиште заявку
              </Link>
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--sky-hero-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <h2 className="text-2xl font-light tracking-[-0.01em] text-[var(--sky-hero-fg)] sm:text-3xl">
              Готові почати?
            </h2>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.1}>
            <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--sky-hero-muted)]">
              Сконфігуруйте свою кухню у 3D за 5 хвилин — і отримайте попередній розрахунок.
            </p>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.2}>
            <Link
              href="/configurator"
              onClick={() => track("cta_configurator_click", { source: "home_bottom_cta" })}
              className="mt-8 inline-flex items-center justify-center bg-[var(--sky-hero-fg)] px-8 py-3.5 text-sm font-medium tracking-[0.02em] text-[var(--sky-hero-bg)] transition hover:opacity-90"
              style={{ borderRadius: 2 }}
              data-cursor-magnetic
            >
              Відкрити конфігуратор
            </Link>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}

