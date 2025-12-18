import Link from "next/link";

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/configurator", label: "Конфігуратор" },
  { href: "/#materials", label: "Матеріали" },
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
                SKY
              </span>
              <span className="text-xs tracking-[0.08em] text-[var(--sky-muted)]">
                kitchens
              </span>
            </div>
            <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-[var(--sky-muted)]">
              Люксовий мінімалізм для сучасного дому. Виробництво в Україні.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
              НАВІГАЦІЯ
            </div>
            <ul className="mt-4 space-y-2.5">
              {links.map((l) => (
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

          {/* Contact */}
          <div>
            <div className="text-xs font-medium tracking-[0.15em] text-[var(--sky-muted2)]">
              КОНТАКТИ
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--sky-muted)]">
              <li>
                <a href="tel:+380501234567" className="transition hover:text-[var(--sky-fg)]">
                  +380 50 123 45 67
                </a>
              </li>
              <li>
                <a href="mailto:hello@sky.kitchen" className="transition hover:text-[var(--sky-fg)]">
                  hello@sky.kitchen
                </a>
              </li>
              <li>Київ, Україна</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--sky-border)] pt-6 text-xs text-[var(--sky-muted2)] sm:flex-row">
          <div>© {new Date().getFullYear()} SKY Kitchens. Всі права захищено.</div>
          <div className="flex gap-5">
            <Link href="#" className="transition hover:text-[var(--sky-fg)]">
              Політика конфіденційності
            </Link>
            <Link href="#" className="transition hover:text-[var(--sky-fg)]">
              Умови використання
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

