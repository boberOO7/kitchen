import Link from "next/link";

const catalogLinks = [
  { href: "/catalog/kitchens", label: "Кухні" },
  { href: "/catalog/living", label: "Вітальні" },
  { href: "/catalog/bedroom", label: "Спальні" },
];

const navLinks = [
  { href: "/configurator", label: "Конфігуратор" },
  { href: "/#materials", label: "Матеріали" },
  { href: "/contacts", label: "Контакти" },
];

export default function SkyFooter() {
  return (
    <footer id="contact" className="border-t border-[var(--sky-border)] bg-[var(--sky-surface)]">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-[0.2em] text-[var(--sky-fg)]">
                SKYY
              </span>
              <span className="text-xs tracking-[0.08em] text-[var(--sky-muted)]">
                furniture
              </span>
            </div>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--sky-muted)]">
              Люксовий мінімалізм для сучасного дому. Виробництво в Україні.
            </p>
          </div>

          {/* Catalog Links */}
          <div>
            <div className="text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
              КАТАЛОГ
            </div>
            <ul className="mt-4 space-y-2.5">
              {catalogLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--sky-muted)] transition hover:text-[var(--sky-fg)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
              НАВІГАЦІЯ
            </div>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-[var(--sky-muted)] transition hover:text-[var(--sky-fg)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--sky-border)] pt-6 text-xs text-[var(--sky-muted2)] sm:flex-row">
          <div>© {new Date().getFullYear()} SKYY Furniture. Всі права захищено.</div>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition hover:text-[var(--sky-fg)]">
              Політика конфіденційності
            </Link>
            <Link href="/terms" className="transition hover:text-[var(--sky-fg)]">
              Умови використання
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

