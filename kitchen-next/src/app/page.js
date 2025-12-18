import PreloadModels from "@/components/PreloadModels";
import Link from "next/link";
import { SKY_PRODUCTS } from "@/data/products";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <PreloadModels />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — Full-width dark block for maximum contrast
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[var(--sky-hero-bg)]">
        {/* Geometric accent line */}
        <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--sky-hero-accent)] to-transparent opacity-40" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--sky-hero-fg) 1px, transparent 1px),
              linear-gradient(to bottom, var(--sky-hero-fg) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
              <span className="h-[1px] w-8 bg-current opacity-50" />
              SKY KITCHENS
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-light leading-[1.1] tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-5xl lg:text-6xl">
              Мінімалізм,
              <br />
              <span className="font-normal">що виглядає дорого.</span>
            </h1>

            {/* Subline */}
            <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-[var(--sky-hero-muted)] sm:text-lg">
              Оберіть фасад, стільницю та корпус у 3D-конфігураторі — і отримайте
              точний розрахунок. Далі — заміри, проєкт, виробництво.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/configurator"
                className="inline-flex items-center justify-center bg-[var(--sky-hero-fg)] px-6 py-3 text-sm font-medium tracking-[0.02em] text-[var(--sky-hero-bg)] transition hover:opacity-90"
                style={{ borderRadius: 2 }}
              >
                Запустити конфігуратор
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center border border-[var(--sky-hero-fg)]/20 px-6 py-3 text-sm font-medium tracking-[0.02em] text-[var(--sky-hero-fg)] transition hover:border-[var(--sky-hero-fg)]/40 hover:bg-[var(--sky-hero-fg)]/5"
                style={{ borderRadius: 2 }}
              >
                Переглянути колекції
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-px border-t border-[var(--sky-hero-fg)]/10 pt-8 sm:mt-20">
            {[
              { value: "5–8", unit: "тижнів", label: "виробництво" },
              { value: "10", unit: "років", label: "гарантія фурнітури" },
              { value: "100%", unit: "", label: "під ключ" },
            ].map((stat, i) => (
              <div key={i} className="text-[var(--sky-hero-fg)]">
                <div className="text-2xl font-light tracking-tight sm:text-3xl">
                  {stat.value}
                  <span className="text-lg font-normal text-[var(--sky-hero-muted)]">
                    {stat.unit && ` ${stat.unit}`}
                  </span>
                </div>
                <div className="mt-1 text-xs tracking-[0.08em] text-[var(--sky-hero-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--sky-bg)] to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          COLLECTIONS SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[var(--sky-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
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
            >
              Увесь каталог →
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKY_PRODUCTS.slice(0, 6).map((p) => (
              <Link
                key={p.slug}
                href="/configurator"
                className="group relative block overflow-hidden border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] shadow-[var(--sky-shadow)] transition hover:shadow-lg"
                style={{ borderRadius: 3 }}
              >
                {/* Image — clickable */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sky-bg-alt)]">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Price badge */}
                  <div
                    className="absolute right-3 top-3 bg-[var(--sky-surface)]/90 px-2.5 py-1 text-xs font-medium tracking-[0.04em] text-[var(--sky-fg)] backdrop-blur-sm"
                    style={{ borderRadius: 2 }}
                  >
                    від €{p.priceFrom.toLocaleString()}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/20">
                    <span className="translate-y-4 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Налаштувати в 3D →
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
                    {p.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--sky-muted)]">
                    {p.tagline}
                  </p>

                  {/* Tags */}
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MATERIALS SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="materials" className="bg-[var(--sky-bg-alt)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
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
              >
                Спробувати в конфігураторі
                <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Material swatches */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { name: "Graphite", color: "#2c2f33" },
                { name: "Warm Oak", color: "#caa472" },
                { name: "Snow", color: "#f4f5f6" },
                { name: "Slate", color: "#1d1f22" },
                { name: "Champagne", color: "#d4a850" },
                { name: "Stone", color: "#c8ccd0" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-3 shadow-[var(--sky-shadow)]"
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--sky-hero-bg)] py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
          <h2 className="text-2xl font-light tracking-[-0.01em] text-[var(--sky-hero-fg)] sm:text-3xl">
            Готові почати?
          </h2>
          <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-relaxed text-[var(--sky-hero-muted)]">
            Сконфігуруйте свою кухню у 3D за 5 хвилин — і отримайте попередній розрахунок.
          </p>
          <Link
            href="/configurator"
            className="mt-8 inline-flex items-center justify-center bg-[var(--sky-hero-fg)] px-8 py-3.5 text-sm font-medium tracking-[0.02em] text-[var(--sky-hero-bg)] transition hover:opacity-90"
            style={{ borderRadius: 2 }}
          >
            Відкрити конфігуратор
          </Link>
        </div>
      </section>
    </>
  );
}
