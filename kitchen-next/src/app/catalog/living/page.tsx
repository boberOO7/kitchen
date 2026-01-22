import Link from "next/link";
import AnimateOnScroll from "@/components/animations/AnimateOnScroll";

export const metadata = {
  title: "Вітальні",
  description: "Колекція меблів для вітальні SKYY — скоро у продажу.",
};

export default function LivingCatalogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--sky-hero-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
              <span className="h-[1px] w-8 bg-current opacity-50" />
              LIVING
            </div>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-3xl font-light tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-4xl">
              Вітальні <span className="font-normal">SKYY</span>
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.2}>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[var(--sky-hero-muted)]">
              Меблі для вітальні в стилі мінімалізму — скоро у нашому каталозі.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="bg-[var(--sky-bg)] py-24 sm:py-32">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="mx-auto max-w-[600px] text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-surface)]" style={{ borderRadius: "50%" }}>
                <svg className="h-8 w-8 text-[var(--sky-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="mt-6 text-2xl font-light text-[var(--sky-fg)]">
                Скоро у продажу
              </h2>
              
              <p className="mt-3 text-sm leading-relaxed text-[var(--sky-muted)]">
                Ми працюємо над колекцією меблів для вітальні. Залиште свій контакт, 
                і ми повідомимо вас, коли колекція буде доступна.
              </p>
              
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/catalog/kitchens"
                  className="inline-flex items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-surface)] px-6 py-3 text-sm font-medium text-[var(--sky-fg)] transition hover:bg-[var(--sky-bg-alt)]"
                  style={{ borderRadius: 2 }}
                >
                  Переглянути кухні
                </Link>
                <Link
                  href="/contacts"
                  className="inline-flex items-center justify-center bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
                  style={{ borderRadius: 2 }}
                >
                  Зв'язатися з нами
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
