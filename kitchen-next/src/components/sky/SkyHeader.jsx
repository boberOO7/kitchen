"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/sky/ThemeToggle";
import ScrollProgress from "@/components/sky/ScrollProgress";
import CartIcon from "@/components/cart/CartIcon";
import AccountMenu from "@/components/header/AccountMenu";

// Catalog categories for dropdown
const catalogCategories = [
  { href: "/catalog/kitchens", label: "Кухні", labelEn: "kitchens" },
  { href: "/catalog/living", label: "Вітальні", labelEn: "living" },
  { href: "/catalog/bedroom", label: "Спальні", labelEn: "bedroom" },
];

const nav = [
  { href: "/configurator", label: "Конфігуратор" },
  { href: "/#materials", label: "Матеріали" },
  { href: "/contacts", label: "Контакти" },
];

// Get contextual label based on current path
function getContextualLabel(pathname) {
  if (pathname.startsWith("/catalog/kitchens") || pathname.startsWith("/configurator")) {
    return "kitchens";
  }
  if (pathname.startsWith("/catalog/living")) {
    return "living";
  }
  if (pathname.startsWith("/catalog/bedroom")) {
    return "bedroom";
  }
  return "furniture";
}

export default function SkyHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef(null);

  const contextLabel = getContextualLabel(pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (catalogRef.current && !catalogRef.current.contains(event.target)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 relative border-b border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group inline-flex h-full items-center gap-2.5 px-2 -ml-2" data-cursor-magnetic>
          <span className="text-sm font-semibold tracking-[0.2em] text-[var(--sky-header-fg)]">
            SKYY
          </span>
          <span className="hidden text-xs tracking-[0.08em] text-[var(--sky-header-muted)] sm:inline">
            {contextLabel}
          </span>
          <span
            className="ml-0.5 inline-block h-1.5 w-1.5 bg-[var(--sky-accent)] opacity-80 transition group-hover:opacity-100"
            style={{ borderRadius: 1 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex h-full">
          {/* Catalog Dropdown */}
          <div
            ref={catalogRef}
            className="relative h-full"
          >
            <button
              type="button"
              onClick={() => setCatalogOpen(!catalogOpen)}
              className="nav-hit flex items-center gap-1.5 text-sm text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)]"
              aria-current={pathname.startsWith("/catalog") ? "page" : undefined}
              data-cursor-magnetic
            >
              Каталог
              <svg
                className={`h-3 w-3 transition-transform duration-200 ease-out ${catalogOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {catalogOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full min-w-[180px] border border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] shadow-lg backdrop-blur-md"
                  style={{ borderRadius: 3 }}
                >
                  {catalogCategories.map((category, i) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      onClick={() => setCatalogOpen(false)}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm text-[var(--sky-header-muted)] transition hover:bg-[var(--sky-header-surface)] hover:text-[var(--sky-header-fg)] ${
                        i === 0 ? "rounded-t-[3px]" : ""
                      } ${i === catalogCategories.length - 1 ? "rounded-b-[3px]" : ""}`}
                    >
                      <span>{category.label}</span>
                      <span className="text-[10px] tracking-[0.1em] text-[var(--sky-header-muted)] opacity-60">
                        {category.labelEn.toUpperCase()}
                      </span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other nav items */}
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-hit text-sm text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)]"
              aria-current={pathname === item.href || pathname.startsWith(item.href + "/") ? "page" : undefined}
              data-cursor-magnetic
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Cart */}
          <CartIcon />

          {/* Account Menu */}
          <AccountMenu />

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
              {/* Catalog section */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}
              >
                <div className="py-2.5 text-xs font-medium tracking-[0.15em] text-[var(--sky-header-muted)]">
                  КАТАЛОГ
                </div>
                <div className="ml-3 space-y-1">
                  {catalogCategories.map((category, i) => (
                    <motion.div
                      key={category.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (i + 1) * 0.05 }}
                    >
                      <Link
                        href={category.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 text-sm text-[var(--sky-header-fg)] transition hover:text-[var(--sky-accent)]"
                      >
                        <span>{category.label}</span>
                        <span className="text-[10px] tracking-[0.08em] text-[var(--sky-header-muted)] opacity-50">
                          {category.labelEn}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <div className="my-3 border-t border-[var(--sky-header-border)]" />

              {/* Other nav items */}
              {nav.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (catalogCategories.length + i + 1) * 0.05 }}
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

              {/* Account section */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (catalogCategories.length + nav.length + 1) * 0.05 }}
                className="mt-3 pt-3 border-t border-[var(--sky-header-border)]"
              >
                <Link
                  href="/checkout"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm text-[var(--sky-header-fg)] transition hover:text-[var(--sky-accent)]"
                >
                  Оформити замовлення
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm text-[var(--sky-header-fg)] transition hover:text-[var(--sky-accent)]"
                >
                  Мій акаунт
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

