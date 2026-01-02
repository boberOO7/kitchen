"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// Icons
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function ArrowPathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function Cog6ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

const menuItems = [
  {
    href: "/account/orders",
    icon: ShoppingBagIcon,
    label: "Замовлення",
    description: "Переглянути історію замовлень та відстежити доставку",
  },
  {
    href: "/account/returns",
    icon: ArrowPathIcon,
    label: "Повернення & підтримка",
    description: "Оформити повернення або зв'язатися з підтримкою",
  },
  {
    href: "/account/addresses",
    icon: MapPinIcon,
    label: "Адреси та оплата",
    description: "Керувати адресами доставки та методами оплати",
  },
  {
    href: "/account/settings",
    icon: Cog6ToothIcon,
    label: "Налаштування",
    description: "Змінити особисті дані та налаштування сповіщень",
  },
];

export default function AccountPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-[var(--sky-fg-muted)]">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)]">Увійдіть в акаунт</h1>
        <p className="text-[var(--sky-fg-muted)] text-center max-w-md">
          Для доступу до вашого акаунту необхідно увійти в систему
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
          style={{ borderRadius: 2 }}
        >
          Увійти
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)] sm:text-3xl">
          Мій акаунт
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Вітаємо, {user.name || user.email}!
        </p>
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-4 border border-[var(--sky-border)] bg-[var(--sky-surface)] p-5 transition hover:border-[var(--sky-accent)]/50 hover:bg-[var(--sky-surface-hover)]"
            style={{ borderRadius: 4 }}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)]" style={{ borderRadius: 4 }}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium text-[var(--sky-fg)] group-hover:text-[var(--sky-accent)] transition">
                  {item.label}
                </h2>
                <ChevronRightIcon className="h-4 w-4 text-[var(--sky-fg-muted)] group-hover:text-[var(--sky-accent)] transition" />
              </div>
              <p className="mt-1 text-sm text-[var(--sky-fg-muted)]">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

