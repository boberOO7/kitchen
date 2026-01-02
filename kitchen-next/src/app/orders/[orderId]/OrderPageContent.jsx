"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getOrderDetails } from "@/app/actions/checkout";
import { getProductImageUrl } from "@/lib/storage";
import SuccessAnimation from "@/components/animations/SuccessAnimation";
import AnimateOnScroll from "@/components/animations/AnimateOnScroll";

import { formatPriceFromMinor } from "@/lib/currency";

function formatPrice(minorUnits) {
  return formatPriceFromMinor(minorUnits);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status badge component
function StatusBadge({ status }) {
  const config = {
    PAID: {
      label: "Оплачено",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    PENDING_PAYMENT: {
      label: "Очікує оплати",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    CANCELLED: {
      label: "Скасовано",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    DRAFT: {
      label: "Чернетка",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    },
    REFUNDED: {
      label: "Повернено",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
  };

  const { label, className } = config[status] || config.DRAFT;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Delivery timeline (placeholder for future)
function DeliveryTimeline({ status }) {
  const steps = [
    { id: "paid", label: "Оплачено", completed: status === "PAID" },
    { id: "processing", label: "В обробці", completed: false },
    { id: "production", label: "Виробництво", completed: false },
    { id: "delivery", label: "Доставка", completed: false },
    { id: "done", label: "Завершено", completed: false },
  ];

  // Only show timeline for paid orders
  if (status !== "PAID") return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-[var(--sky-fg)] mb-4">Статус виконання</h3>
      <div className="relative">
        {/* Line */}
        <div className="absolute left-3 top-3 h-[calc(100%-24px)] w-px bg-[var(--sky-border)]" />
        
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-center gap-4">
              <div
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                  step.completed
                    ? "bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                    : "border-2 border-[var(--sky-border)] bg-[var(--sky-surface)]"
                }`}
              >
                {step.completed && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${step.completed ? "text-[var(--sky-fg)] font-medium" : "text-[var(--sky-muted)]"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrderPageContent({ orderId, showSuccessAnimation }) {
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(showSuccessAnimation);
  const isFetchingRef = useRef(false);

  // Initial fetch
  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialOrder() {
      if (!orderId || isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      setIsLoading(true);
      
      try {
        const result = await getOrderDetails(orderId);
        
        if (!isCancelled) {
          if (result.success && result.order) {
            setOrderData(result);
            setError(null);
          } else if (result.error === "UNAUTHORIZED") {
            window.location.href = `/login?redirect=/orders/${orderId}`;
            return;
          } else {
            setError(result.error || "Замовлення не знайдено");
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to fetch order:", err);
          setError("Не вдалося завантажити замовлення");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    }
    
    fetchInitialOrder();
    
    return () => {
      isCancelled = true;
    };
  }, [orderId]);

  // Poll for status updates if pending payment
  useEffect(() => {
    if (orderData?.order?.status !== "PENDING_PAYMENT") return;
    
    const interval = setInterval(async () => {
      if (isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      try {
        const result = await getOrderDetails(orderId);
        if (result.success && result.order) {
          setOrderData(result);
        } else if (result.error === "UNAUTHORIZED") {
          window.location.href = `/login?redirect=/orders/${orderId}`;
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        isFetchingRef.current = false;
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [orderData?.order?.status, orderId]);

  // Handle animation complete
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Remove success param from URL without reload
    window.history.replaceState({}, "", `/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--sky-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
          <p className="text-[var(--sky-muted)]">Завантаження замовлення...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData?.order) {
    return (
      <section className="bg-[var(--sky-bg)] py-20 min-h-[60vh]">
        <div className="mx-auto max-w-[600px] px-4 text-center">
          <svg className="mx-auto h-16 w-16 text-[var(--sky-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="mt-6 text-2xl font-light text-[var(--sky-fg)]">
            Замовлення не знайдено
          </h1>
          <p className="mt-2 text-[var(--sky-muted)]">{error || "Не вдалося завантажити дані"}</p>
          <Link
            href="/catalog"
            className="mt-8 inline-flex items-center justify-center rounded bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
          >
            Перейти до каталогу
          </Link>
        </div>
      </section>
    );
  }

  const { order, payment } = orderData;
  const shortOrderId = order.id.slice(0, 8).toUpperCase();

  return (
    <>
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showAnimation && order.status === "PAID" && (
          <SuccessAnimation 
            orderId={shortOrderId} 
            onComplete={handleAnimationComplete} 
          />
        )}
      </AnimatePresence>

      {/* Page Content */}
      <motion.div
        initial={showSuccessAnimation ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: showAnimation ? 0 : 1 }}
        transition={{ duration: 0.5, delay: showAnimation ? 0 : 0.3 }}
      >
        {/* Hero */}
        <section className="bg-[var(--sky-hero-bg)] py-12 sm:py-16">
          <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
            <AnimateOnScroll variant="fadeUp">
              <div className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-[var(--sky-hero-muted)]">
                <Link href="/catalog" className="hover:text-[var(--sky-accent)] transition-colors">
                  КАТАЛОГ
                </Link>
                <span>/</span>
                <span>ЗАМОВЛЕННЯ</span>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll variant="fadeUp" delay={0.1}>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <h1 className="text-2xl font-light tracking-[-0.02em] text-[var(--sky-hero-fg)] sm:text-3xl">
                  Замовлення #{shortOrderId}
                </h1>
                <StatusBadge status={order.status} />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll variant="fadeUp" delay={0.15}>
              <p className="mt-2 text-sm text-[var(--sky-hero-muted)]">
                {formatDate(order.createdAt)}
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-[var(--sky-bg)] py-12 sm:py-16">
          <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Items List */}
              <div className="lg:col-span-2">
                <AnimateOnScroll variant="fadeUp" delay={0.1}>
                  <div className="rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                    <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-6">
                      Товари
                    </h2>

                    <div className="divide-y divide-[var(--sky-border)]">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                          {/* Image */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-[var(--sky-bg-alt)]">
                            {item.product?.imageKey ? (
                              <Image
                                src={getProductImageUrl(item.product.imageKey)}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[var(--sky-muted)]">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-[var(--sky-fg)]">
                                {item.name}
                              </h3>
                              <p className="text-sm text-[var(--sky-muted)]">
                                ${formatPrice(item.unitPrice)} × {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-[var(--sky-fg)]">
                              ${formatPrice(item.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimateOnScroll>

                {/* Delivery Timeline */}
                <AnimateOnScroll variant="fadeUp" delay={0.2}>
                  <div className="mt-6 rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                    <DeliveryTimeline status={order.status} />
                    
                    {order.status !== "PAID" && (
                      <p className="text-sm text-[var(--sky-muted)]">
                        {order.status === "PENDING_PAYMENT" 
                          ? "Очікуємо підтвердження оплати..."
                          : order.status === "CANCELLED"
                          ? "Це замовлення було скасовано."
                          : "Завершіть оплату для обробки замовлення."}
                      </p>
                    )}
                  </div>
                </AnimateOnScroll>
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <AnimateOnScroll variant="fadeUp" delay={0.2}>
                  <div className="sticky top-24 space-y-6">
                    {/* Order Summary */}
                    <div className="rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                      <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                        Підсумок
                      </h2>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--sky-muted)]">Товари ({order.items.length})</span>
                          <span className="text-[var(--sky-fg)]">${formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--sky-muted)]">Доставка</span>
                          <span className="text-[var(--sky-fg)]">Безкоштовно</span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[var(--sky-border)] pt-4">
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--sky-fg)]">Всього</span>
                          <span className="text-xl font-medium text-[var(--sky-fg)]">
                            ${formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {payment && (
                      <div className="rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                        <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                          Оплата
                        </h2>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--sky-muted)]">Спосіб</span>
                            <span className="text-[var(--sky-fg)]">
                              {payment.provider === "MONOBANK" ? "Monobank" : payment.provider}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--sky-muted)]">Статус</span>
                            <span className={`font-medium ${
                              payment.status === "SUCCEEDED" ? "text-green-600" :
                              payment.status === "PENDING" ? "text-yellow-600" :
                              payment.status === "FAILED" || payment.status === "CANCELED" ? "text-red-600" :
                              "text-[var(--sky-fg)]"
                            }`}>
                              {payment.status === "SUCCEEDED" ? "Успішно" :
                               payment.status === "PENDING" ? "Обробляється" :
                               payment.status === "FAILED" ? "Помилка" :
                               payment.status === "CANCELED" ? "Скасовано" :
                               payment.status === "CREATED" ? "Створено" :
                               payment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/catalog"
                        className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                      >
                        Продовжити покупки
                      </Link>
                      <Link
                        href="/contacts"
                        className="flex items-center justify-center rounded border border-[var(--sky-border)] bg-transparent px-4 py-3 text-sm font-medium text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)]"
                      >
                        Зв'язатися з нами
                      </Link>
                    </div>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </>
  );
}

