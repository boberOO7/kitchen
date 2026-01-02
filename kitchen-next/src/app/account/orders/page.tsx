"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

export default function OrdersPage() {
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
          Для перегляду замовлень необхідно увійти в систему
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
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm text-[var(--sky-fg-muted)] hover:text-[var(--sky-fg)] transition mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Назад до акаунту
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)] sm:text-3xl">
          Мої замовлення
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Переглядайте історію та відстежуйте статус ваших замовлень
        </p>
      </div>

      {/* Empty State */}
      {/* TODO: Replace with actual orders list from API */}
      <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-8 py-16 text-center" style={{ borderRadius: 4 }}>
        <div className="flex h-16 w-16 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] mb-4" style={{ borderRadius: 8 }}>
          <ShoppingBagIcon className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-medium text-[var(--sky-fg)]">
          У вас ще немає замовлень
        </h2>
        <p className="mt-2 text-sm text-[var(--sky-fg-muted)] max-w-sm">
          Коли ви зробите перше замовлення, воно з'явиться тут. Почніть з перегляду нашого каталогу.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex items-center justify-center bg-[var(--sky-accent)] px-5 py-2.5 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
          style={{ borderRadius: 2 }}
        >
          Перейти до каталогу
        </Link>
      </div>
    </div>
  );
}

