"use client";

import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/animations/AnimateOnScroll";

export default function ContactsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--sky-hero-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
              <span className="h-[1px] w-8 bg-current opacity-50" />
              CONTACTS
            </div>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-3xl font-light tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-4xl">
              Звʼяжіться <span className="font-normal">з нами</span>
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.2}>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[var(--sky-hero-muted)]">
              Ми завжди раді допомогти з вибором кухні або відповісти на ваші питання.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-[var(--sky-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <StaggerContainer staggerDelay={0.1} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Phone */}
            <StaggerItem variant="fadeUp">
              <div
                className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]"
                style={{ borderRadius: 3 }}
              >
                <div className="flex h-12 w-12 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] text-[var(--sky-accent)]" style={{ borderRadius: 2 }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-medium text-[var(--sky-fg)]">Телефон</h3>
                <a href="tel:+380XXXXXXXXX" className="mt-2 block text-lg font-medium text-[var(--sky-fg)] hover:text-[var(--sky-accent)]">
                  +380 XX XXX XX XX
                </a>
                <p className="mt-1 text-xs text-[var(--sky-muted)]">Пн–Пт: 9:00–18:00</p>
              </div>
            </StaggerItem>

            {/* Email */}
            <StaggerItem variant="fadeUp">
              <div
                className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]"
                style={{ borderRadius: 3 }}
              >
                <div className="flex h-12 w-12 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] text-[var(--sky-accent)]" style={{ borderRadius: 2 }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-medium text-[var(--sky-fg)]">Email</h3>
                <a href="mailto:info@sky-kitchens.com" className="mt-2 block text-lg font-medium text-[var(--sky-fg)] hover:text-[var(--sky-accent)]">
                  info@sky-kitchens.com
                </a>
                <p className="mt-1 text-xs text-[var(--sky-muted)]">Відповідаємо протягом 24 годин</p>
              </div>
            </StaggerItem>

            {/* Address */}
            <StaggerItem variant="fadeUp">
              <div
                className="border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]"
                style={{ borderRadius: 3 }}
              >
                <div className="flex h-12 w-12 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-bg-alt)] text-[var(--sky-accent)]" style={{ borderRadius: 2 }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-medium text-[var(--sky-fg)]">Шоурум</h3>
                <p className="mt-2 text-lg font-medium text-[var(--sky-fg)]">
                  м. Київ
                </p>
                <p className="mt-1 text-xs text-[var(--sky-muted)]">За попереднім записом</p>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Contact Form */}
          <AnimateOnScroll variant="fadeUp" delay={0.3}>
            <div
              className="mt-12 border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)] sm:p-8"
              style={{ borderRadius: 3 }}
            >
              <h2 className="text-lg font-medium text-[var(--sky-fg)]">
                Залишити заявку
              </h2>
              <p className="mt-1 text-sm text-[var(--sky-muted)]">
                Опишіть ваш запит і ми звʼяжемося з вами найближчим часом
              </p>

              <form className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--sky-muted)]">
                    Імʼя
                  </label>
                  <input
                    type="text"
                    placeholder="Ваше імʼя"
                    className="w-full border border-[var(--sky-border)] bg-[var(--sky-surface)] px-4 py-2.5 text-sm text-[var(--sky-fg)] placeholder:text-[var(--sky-muted2)] focus:border-[var(--sky-accent)] focus:outline-none"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--sky-muted)]">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    placeholder="+380"
                    className="w-full border border-[var(--sky-border)] bg-[var(--sky-surface)] px-4 py-2.5 text-sm text-[var(--sky-fg)] placeholder:text-[var(--sky-muted2)] focus:border-[var(--sky-accent)] focus:outline-none"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-[var(--sky-muted)]">
                    Повідомлення
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Опишіть ваш запит..."
                    className="w-full resize-none border border-[var(--sky-border)] bg-[var(--sky-surface)] px-4 py-2.5 text-sm text-[var(--sky-fg)] placeholder:text-[var(--sky-muted2)] focus:border-[var(--sky-accent)] focus:outline-none"
                    style={{ borderRadius: 2 }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-[var(--sky-accent)] py-3 text-sm font-medium tracking-[0.02em] text-[var(--sky-accent-fg)] transition hover:opacity-90 sm:w-auto sm:px-8"
                    style={{ borderRadius: 2 }}
                  >
                    Надіслати заявку
                  </button>
                </div>
              </form>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}

