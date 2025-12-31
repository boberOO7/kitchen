"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { getProductImageUrl } from "@/lib/storage";
import AnimateOnScroll, { StaggerContainer, StaggerItem } from "@/components/animations/AnimateOnScroll";

function formatPrice(price) {
  return new Intl.NumberFormat("uk-UA").format(price);
}

export default function CartPageContent() {
  const {
    cart,
    isLoading,
    isPending,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--sky-hero-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <AnimateOnScroll variant="fadeUp">
            <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
              <span className="h-[1px] w-8 bg-current opacity-50" />
              КОШИК
            </div>
          </AnimateOnScroll>
          
          <AnimateOnScroll variant="fadeUp" delay={0.1}>
            <h1 className="mt-4 text-3xl font-light tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-4xl">
              Ваше замовлення
            </h1>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Cart Content */}
      <section className="bg-[var(--sky-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {!cart || cart.items.length === 0 ? (
            <AnimateOnScroll variant="fadeUp">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="h-24 w-24 text-[var(--sky-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="mt-6 text-xl font-medium text-[var(--sky-fg)]">
                  Кошик порожній
                </h2>
                <p className="mt-2 text-[var(--sky-muted)]">
                  Додайте товари з каталогу, щоб оформити замовлення
                </p>
                <Link
                  href="/catalog"
                  className="mt-8 inline-flex items-center justify-center rounded bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                >
                  Перейти до каталогу
                </Link>
              </div>
            </AnimateOnScroll>
          ) : (
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Items List */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between border-b border-[var(--sky-border)] pb-4">
                  <h2 className="text-lg font-medium text-[var(--sky-fg)]">
                    Товари ({cart.itemCount})
                  </h2>
                  <button
                    onClick={clearCart}
                    disabled={isPending}
                    className="text-sm text-[var(--sky-muted)] transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    Очистити все
                  </button>
                </div>

                <StaggerContainer staggerDelay={0.05} className="divide-y divide-[var(--sky-border)]">
                  {cart.items.map((item) => (
                    <StaggerItem key={item.id} variant="fadeUp">
                      <div className="flex gap-6 py-6">
                        {/* Image */}
                        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded bg-[var(--sky-bg-alt)]">
                          {item.product?.imageKey ? (
                            <Image
                              src={getProductImageUrl(item.product.imageKey)}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[var(--sky-muted)]">
                              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-[var(--sky-fg)]">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-[var(--sky-muted)]">
                              ${formatPrice(item.unitPrice)} / шт
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                disabled={isPending || item.quantity <= 1}
                                className="flex h-9 w-9 items-center justify-center rounded border border-[var(--sky-border)] text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)] disabled:opacity-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-10 text-center text-lg font-medium text-[var(--sky-fg)]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={isPending}
                                className="flex h-9 w-9 items-center justify-center rounded border border-[var(--sky-border)] text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)] disabled:opacity-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            {/* Line total & Remove */}
                            <div className="flex items-center gap-4">
                              <p className="text-lg font-medium text-[var(--sky-fg)]">
                                ${formatPrice(item.total)}
                              </p>
                              <button
                                onClick={() => removeItem(item.productId)}
                                disabled={isPending}
                                className="text-[var(--sky-muted)] transition-colors hover:text-red-500 disabled:opacity-50"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <AnimateOnScroll variant="fadeUp" delay={0.2}>
                  <div className="sticky top-24 rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                    <h2 className="text-lg font-medium text-[var(--sky-fg)]">
                      Підсумок
                    </h2>

                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--sky-muted)]">Товари ({cart.itemCount})</span>
                        <span className="text-[var(--sky-fg)]">${formatPrice(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--sky-muted)]">Доставка</span>
                        <span className="text-[var(--sky-fg)]">Безкоштовно</span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--sky-border)] pt-6">
                      <div className="flex justify-between">
                        <span className="text-lg font-medium text-[var(--sky-fg)]">Разом</span>
                        <span className="text-2xl font-medium text-[var(--sky-fg)]">
                          ${formatPrice(cart.total)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="mt-6 w-full rounded bg-[var(--sky-accent)] px-4 py-4 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                    >
                      Оформити замовлення
                    </button>

                    <Link
                      href="/catalog"
                      className="mt-4 block text-center text-sm text-[var(--sky-muted)] transition-colors hover:text-[var(--sky-fg)]"
                    >
                      Продовжити покупки
                    </Link>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

