"use client";

import Link from "next/link";
import Image from "next/image";
import { SKY_PRODUCTS } from "@/data/products";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/animations/AnimateOnScroll";

// Fixed price formatter to avoid hydration mismatch (server vs client locale)
function formatPrice(price) {
  return new Intl.NumberFormat("uk-UA").format(price);
}

export default function CatalogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--sky-hero-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
              <span className="h-[1px] w-8 bg-current opacity-50" />
              CATALOG
            </div>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-3xl font-light tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-4xl">
              Всі колекції <span className="font-normal">SKY</span>
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.2}>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[var(--sky-hero-muted)]">
              Оберіть базову композицію та налаштуйте матеріали під ваш інтерʼєр
              у 3D-конфігураторі.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Products grid */}
      <section className="bg-[var(--sky-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <StaggerContainer staggerDelay={0.08} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SKY_PRODUCTS.map((p) => (
              <StaggerItem key={p.slug} variant="fadeUp">
                <Link
                  href="/configurator"
                  className="group block overflow-hidden border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] shadow-[var(--sky-shadow)] transition duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ borderRadius: 3 }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--sky-bg-alt)]">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div
                      className="absolute right-3 top-3 bg-[var(--sky-surface)]/90 px-2.5 py-1 text-xs font-medium tracking-[0.04em] text-[var(--sky-fg)] backdrop-blur-sm"
                      style={{ borderRadius: 2 }}
                    >
                      від €{formatPrice(p.priceFrom)}
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
                    <h2 className="text-lg font-medium tracking-[-0.01em] text-[var(--sky-fg)]">
                      {p.name}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--sky-muted)]">
                      {p.tagline}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.highlights.map((h) => (
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
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}

