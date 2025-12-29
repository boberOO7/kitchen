"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/sky/ThemeToggle";
import ScrollProgress from "@/components/sky/ScrollProgress";
import { track } from "@/lib/analytics";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/configurator", label: "Конфігуратор" },
  { href: "/#materials", label: "Матеріали" },
  { href: "/contacts", label: "Контакти" },
];

export default function SkyHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 relative border-b border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group inline-flex items-center gap-2.5" data-cursor-magnetic>
          <span className="text-sm font-semibold tracking-[0.2em] text-[var(--sky-header-fg)]">
            SKY
          </span>
          <span className="hidden text-xs tracking-[0.08em] text-[var(--sky-header-muted)] sm:inline">
            kitchens
          </span>
          <span
            className="ml-0.5 inline-block h-1.5 w-1.5 bg-[var(--sky-accent)] opacity-80 transition group-hover:opacity-100"
            style={{ borderRadius: 1 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)]"
              data-cursor-magnetic
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Login link */}
          <Link
            href="/login"
            className="hidden items-center justify-center border border-[var(--sky-header-border)] px-3 py-2 text-xs font-medium tracking-[0.04em] text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)] hover:border-[var(--sky-header-fg)] sm:inline-flex"
            style={{ borderRadius: 2 }}
            data-cursor-magnetic
          >
            Увійти
          </Link>
          
          {/* Desktop CTA */}
          <Link
            href="/configurator"
            onClick={() => track("cta_configurator_click", { source: "header" })}
            className="hidden items-center justify-center bg-[var(--sky-accent)] px-4 py-2 text-xs font-medium tracking-[0.04em] text-[var(--sky-accent-fg)] transition hover:opacity-90 sm:inline-flex"
            style={{ borderRadius: 2 }}
            data-cursor-magnetic
          >
            Зібрати кухню
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] text-[var(--sky-header-fg)] md:hidden"
            style={{ borderRadius: 2 }}
            aria-label="Toggle menu"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] md:hidden"
          >
            <nav className="flex flex-col px-4 py-4">
              {nav.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 text-sm text-[var(--sky-header-fg)] transition hover:text-[var(--sky-accent)]"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: nav.length * 0.05 }}
                className="mt-3 pt-3 border-t border-[var(--sky-header-border)]"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm text-[var(--sky-header-fg)] transition hover:text-[var(--sky-accent)]"
                >
                  Увійти
                </Link>
                <Link
                  href="/configurator"
                  onClick={() => {
                    track("cta_configurator_click", { source: "mobile_menu" });
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 inline-flex w-full items-center justify-center bg-[var(--sky-accent)] px-4 py-2.5 text-sm font-medium text-[var(--sky-accent-fg)]"
                  style={{ borderRadius: 2 }}
                >
                  Зібрати кухню
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delicate scroll progress (home page only) */}
      <ScrollProgress />
    </header>
  );
}

