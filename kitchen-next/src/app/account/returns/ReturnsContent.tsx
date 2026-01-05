"use client";

import Link from "next/link";
import type { AccountUser } from "@/app/actions/account";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ChatBubbleLeftRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
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

function QuestionMarkCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  );
}

const supportOptions = [
  {
    icon: ArrowPathIcon,
    title: "Оформити повернення",
    description: "Поверніть товар протягом 14 днів з моменту отримання",
    action: "Почати повернення",
    href: "#", // TODO: Implement return flow
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Зв'язатися з підтримкою",
    description: "Наші спеціалісти допоможуть вирішити будь-яке питання",
    action: "Написати нам",
    href: "mailto:support@skykitchens.ua",
  },
  {
    icon: QuestionMarkCircleIcon,
    title: "Часті питання",
    description: "Знайдіть відповіді на найпоширеніші запитання",
    action: "Переглянути FAQ",
    href: "/contacts#faq", // TODO: Create FAQ page
  },
];

interface ReturnsContentProps {
  user: AccountUser;
}

export default function ReturnsContent({ user }: ReturnsContentProps) {
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
          Повернення & підтримка
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Оформіть повернення або зв'яжіться з нашою командою підтримки
        </p>
      </div>

      {/* Support Options */}
      <div className="grid gap-4">
        {supportOptions.map((option) => (
          <Link
            key={option.title}
            href={option.href}
            className="group flex items-start gap-4 border border-[var(--sky-border)] bg-[var(--sky-surface)] p-5 transition hover:border-[var(--sky-accent)]/50 hover:bg-[var(--sky-surface-hover)]"
            style={{ borderRadius: 4 }}
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)]" style={{ borderRadius: 4 }}>
              <option.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-[var(--sky-fg)] group-hover:text-[var(--sky-accent)] transition">
                {option.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--sky-fg-muted)]">
                {option.description}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-[var(--sky-accent)]">
                {option.action}
                <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Contact Info */}
      <div className="mt-10 border-t border-[var(--sky-border)] pt-8">
        <h3 className="text-sm font-medium text-[var(--sky-fg)] mb-4">
          Контактна інформація
        </h3>
        <div className="grid gap-3 text-sm text-[var(--sky-fg-muted)]">
          <p>
            <span className="text-[var(--sky-fg)]">Email:</span>{" "}
            <a href="mailto:support@skykitchens.ua" className="hover:text-[var(--sky-accent)] transition">
              support@skykitchens.ua
            </a>
          </p>
          <p>
            <span className="text-[var(--sky-fg)]">Телефон:</span>{" "}
            <a href="tel:+380441234567" className="hover:text-[var(--sky-accent)] transition">
              +38 (044) 123-45-67
            </a>
          </p>
          <p>
            <span className="text-[var(--sky-fg)]">Графік роботи:</span>{" "}
            Пн-Пт 9:00-18:00
          </p>
        </div>
      </div>
    </div>
  );
}

