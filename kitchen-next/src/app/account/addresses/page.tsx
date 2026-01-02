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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export default function AddressesPage() {
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
          Для керування адресами необхідно увійти в систему
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
          Адреси та оплата
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Керуйте адресами доставки та збереженими методами оплати
        </p>
      </div>

      {/* Addresses Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Адреси доставки
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sky-accent)] hover:text-[var(--sky-accent)]/80 transition"
            // TODO: Implement add address modal
          >
            <PlusIcon className="h-4 w-4" />
            Додати адресу
          </button>
        </div>

        {/* Empty State for Addresses */}
        {/* TODO: Replace with actual addresses from API */}
        <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-6 py-10 text-center" style={{ borderRadius: 4 }}>
          <div className="flex h-12 w-12 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] mb-3" style={{ borderRadius: 8 }}>
            <MapPinIcon className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-[var(--sky-fg)]">
            Немає збережених адрес
          </h3>
          <p className="mt-1.5 text-sm text-[var(--sky-fg-muted)] max-w-sm">
            Додайте адресу доставки для швидшого оформлення замовлень
          </p>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Методи оплати
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sky-accent)] hover:text-[var(--sky-accent)]/80 transition"
            // TODO: Implement add payment method
          >
            <PlusIcon className="h-4 w-4" />
            Додати картку
          </button>
        </div>

        {/* Empty State for Payment Methods */}
        {/* TODO: Replace with actual payment methods from API */}
        <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-6 py-10 text-center" style={{ borderRadius: 4 }}>
          <div className="flex h-12 w-12 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] mb-3" style={{ borderRadius: 8 }}>
            <CreditCardIcon className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-[var(--sky-fg)]">
            Немає збережених карток
          </h3>
          <p className="mt-1.5 text-sm text-[var(--sky-fg-muted)] max-w-sm">
            Картки зберігаються безпечно та доступні тільки вам
          </p>
        </div>
      </section>
    </div>
  );
}

