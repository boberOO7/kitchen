"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
  const lastUpdated = "2 січня 2026";

  return (
    <main className="min-h-screen bg-[var(--sky-bg)]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--sky-muted)] transition hover:text-[var(--sky-fg)] mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            На головну
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-light text-[var(--sky-fg)] mb-2">
            Умови використання сайту
          </h1>
          <p className="text-sm text-[var(--sky-muted)] mb-12">
            Останнє оновлення: {lastUpdated}
          </p>

          {/* Content */}
          <div className="space-y-10 text-[var(--sky-muted)]">
            <Section title="1. Загальні положення">
              <p>
                Цей сайт належить SKYY furniture і призначений для ознайомлення з продукцією 
                та оформлення замовлень.
              </p>
            </Section>

            <Section title="2. Оформлення замовлення">
              <p>
                Замовлення вважається оформленим після підтвердження клієнтом та здійснення оплати.
              </p>
            </Section>

            <Section title="3. Оплата">
              <p>
                Оплата здійснюється через захищені платіжні системи (зокрема monobank, Google Pay).
              </p>
              <p className="mt-4">
                Компанія не зберігає дані банківських карток.
              </p>
            </Section>

            <Section title="4. Доставка">
              <p>
                Доставка товарів здійснюється через службу Нова Пошта відповідно до обраних умов.
              </p>
            </Section>

            <Section title="5. Повернення та гарантія">
              <p>
                Товари, виготовлені за індивідуальним замовленням клієнта, не підлягають поверненню, 
                відповідно до законодавства України.
              </p>
              <p className="mt-4">
                Гарантійні умови визначаються індивідуально для кожного виробу.
              </p>
            </Section>

            <Section title="6. Відповідальність">
              <p>
                Компанія не несе відповідальності за затримки або збої, спричинені обставинами, 
                що не залежать від неї.
              </p>
            </Section>

            <Section title="7. Зміни умов">
              <p>
                Компанія має право змінювати ці Умови. Актуальна версія завжди доступна на сайті.
              </p>
            </Section>

            <Section title="8. Контакти">
              <p>
                <a 
                  href="mailto:hello@skyy.furniture" 
                  className="text-[var(--sky-fg)] underline underline-offset-4 hover:no-underline transition"
                >
                  hello@skyy.furniture
                </a>
              </p>
            </Section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

