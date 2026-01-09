"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
            Політика конфіденційності
          </h1>
          <p className="text-sm text-[var(--sky-muted)] mb-12">
            Останнє оновлення: {lastUpdated}
          </p>

          {/* Content */}
          <div className="space-y-10 text-[var(--sky-muted)]">
            <Section title="1. Загальні положення">
              <p>
                Ця Політика конфіденційності описує, як SKYY furniture (надалі — «Компанія») 
                збирає, використовує та захищає персональні дані користувачів сайту.
              </p>
            </Section>

            <Section title="2. Які дані ми збираємо">
              <p>Ми можемо збирати такі дані:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>ім'я та прізвище</li>
                <li>адреса електронної пошти</li>
                <li>номер телефону</li>
                <li>адреса доставки</li>
                <li>інформація про замовлення</li>
              </ul>
            </Section>

            <Section title="3. Мета обробки даних">
              <p>Персональні дані використовуються для:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>оформлення та обробки замовлень</li>
                <li>доставки товарів</li>
                <li>зв'язку з клієнтом щодо замовлення</li>
                <li>виконання вимог законодавства</li>
              </ul>
            </Section>

            <Section title="4. Платежі та передача даних третім особам">
              <p>
                Оплата здійснюється через захищені платіжні сервіси (зокрема monobank, Google Pay).
                Компанія не зберігає платіжні дані користувачів.
              </p>
              <p className="mt-4">Персональні дані можуть передаватися:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>платіжним сервісам</li>
                <li>службам доставки (зокрема Нова Пошта)</li>
              </ul>
              <p className="mt-3">виключно з метою виконання замовлення.</p>
            </Section>

            <Section title="5. Email-повідомлення">
              <p>
                Компанія може надсилати користувачам сервісні повідомлення, пов'язані із замовленням.
              </p>
              <p className="mt-4">
                Інформаційні повідомлення (новини, оновлення, нові продукти) надсилаються лише за згодою 
                користувача, яку можна відкликати у будь-який момент.
              </p>
            </Section>

            <Section title="6. Захист даних">
              <p>
                Компанія вживає необхідних технічних та організаційних заходів для захисту персональних даних.
              </p>
            </Section>

            <Section title="7. Права користувача">
              <p>Користувач має право:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>отримати інформацію про свої персональні дані</li>
                <li>вимагати їх виправлення або видалення</li>
                <li>відкликати згоду на обробку даних</li>
              </ul>
            </Section>

            <Section title="8. Контакти">
              <p>З питань, пов'язаних із персональними даними:</p>
              <p className="mt-3">
                <a 
                  href="mailto:legal@skyy.furniture" 
                  className="text-[var(--sky-fg)] underline underline-offset-4 hover:no-underline transition"
                >
                  legal@skyy.furniture
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

