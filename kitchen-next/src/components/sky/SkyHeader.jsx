import Link from "next/link";
import ThemeToggle from "@/components/sky/ThemeToggle";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/configurator", label: "Конфігуратор" },
  { href: "/#materials", label: "Матеріали" },
  { href: "/#contact", label: "Контакти" },
];

export default function SkyHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group inline-flex items-center gap-2.5">
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

        {/* Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/configurator"
            className="hidden items-center justify-center bg-[var(--sky-accent)] px-4 py-2 text-xs font-medium tracking-[0.04em] text-[var(--sky-accent-fg)] transition hover:opacity-90 sm:inline-flex"
            style={{ borderRadius: 2 }}
          >
            Зібрати кухню
          </Link>
        </div>
      </div>
    </header>
  );
}
