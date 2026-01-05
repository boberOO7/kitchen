"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getOrderDetails, editOrderAsNewDraft, cancelOrder } from "@/app/actions/checkout";
import { getProductImageUrl } from "@/lib/storage";
import { useCart } from "@/contexts/CartContext";
import SuccessAnimation from "@/components/animations/SuccessAnimation";
import AnimateOnScroll from "@/components/animations/AnimateOnScroll";

import { formatPriceFromMinor } from "@/lib/currency";
import { formatUahFromMinor } from "@/lib/nbu";

// Installment status labels
const INSTALLMENT_STATUS_LABELS = {
  CREATED: { label: "Створено", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  PENDING_CUSTOMER: { label: "Очікує підтвердження", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  PENDING_MERCHANT: { label: "Потребує підтвердження", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  APPROVED: { label: "Схвалено", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  DECLINED: { label: "Відхилено", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  CANCELED: { label: "Скасовано", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  EXPIRED: { label: "Термін минув", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

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
    EXPIRED: {
      label: "Термін минув",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
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
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasShownAnimation, setHasShownAnimation] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isMerchantConfirming, setIsMerchantConfirming] = useState(false);
  const pollIntervalRef = useRef(null);

  // Initial fetch - only depends on orderId
  useEffect(() => {
    let isCancelled = false;

    async function fetchInitialOrder() {
      if (!orderId) return;
      
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
        }
      }
    }
    
    fetchInitialOrder();
    
    return () => {
      isCancelled = true;
    };
  }, [orderId]);

  // Show success animation when order is PAID (separate effect)
  useEffect(() => {
    if (orderData?.order?.status === "PAID" && !hasShownAnimation && showSuccessAnimation) {
      setShowAnimation(true);
      setHasShownAnimation(true);
    }
  }, [orderData?.order?.status, hasShownAnimation, showSuccessAnimation]);

  // Poll for status updates ONLY if payment was created recently (within 3 minutes)
  // This avoids unnecessary polling when just browsing old pending orders
  useEffect(() => {
    if (orderData?.order?.status !== "PENDING_PAYMENT") return;
    
    // Check if payment was created recently (within 3 minutes)
    const payment = orderData?.payment;
    if (!payment?.createdAt) return;
    
    const paymentCreatedAt = new Date(payment.createdAt).getTime();
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
    
    // Don't poll for old pending orders
    if (paymentCreatedAt < threeMinutesAgo) {
      return;
    }
    
    let isPollingCancelled = false;
    
    const interval = setInterval(async () => {
      if (isPollingCancelled) return;
      
      // Stop polling if payment is too old now
      const now = Date.now();
      if (paymentCreatedAt < now - 3 * 60 * 1000) {
        clearInterval(interval);
        return;
      }
      
      try {
        const result = await getOrderDetails(orderId);
        if (isPollingCancelled) return;
        
        if (result.success && result.order) {
          setOrderData(result);
          
          // Show success animation when payment is confirmed
          if (result.order.status === "PAID") {
            setShowAnimation(true);
            setHasShownAnimation(true);
          }
        } else if (result.error === "UNAUTHORIZED") {
          window.location.href = `/login?redirect=/orders/${orderId}`;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds (enough for webhook to process)
    
    return () => {
      isPollingCancelled = true;
      clearInterval(interval);
    };
  }, [orderData?.order?.status, orderData?.payment?.createdAt, orderId]);

  // Poll for installment status updates
  useEffect(() => {
    if (orderData?.order?.status !== "PENDING_PAYMENT") return;
    if (orderData?.order?.paymentMethod !== "MONO_INSTALLMENTS") return;
    
    const installment = orderData?.installment;
    if (!installment) return;
    
    // Only poll for non-terminal statuses
    const terminalStatuses = ["APPROVED", "DECLINED", "CANCELED", "EXPIRED"];
    if (terminalStatuses.includes(installment.status)) return;
    
    let isPollingCancelled = false;
    
    const pollFn = async () => {
      if (isPollingCancelled) return;
      
      try {
        const response = await fetch(`/api/payments/mono-installments/status?orderId=${orderId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (isPollingCancelled) return;
        
        // Update local state if status changed
        if (data.status !== installment.status) {
          // Refetch full order data
          const result = await getOrderDetails(orderId);
          if (result.success && result.order) {
            setOrderData(result);
            
            // Show success animation when approved and clear cart
            if (data.status === "APPROVED") {
              setShowAnimation(true);
              setHasShownAnimation(true);
              // Clear cart after successful installment payment
              clearCart();
            }
          }
        }
        
        // Stop polling on terminal status
        if (terminalStatuses.includes(data.status)) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } catch (e) {
        console.error("Installment polling error:", e);
      }
    };
    
    // Start polling every 3 seconds
    pollIntervalRef.current = setInterval(pollFn, 3000);
    
    return () => {
      isPollingCancelled = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [orderData?.order?.status, orderData?.order?.paymentMethod, orderData?.installment?.status, orderId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle animation complete
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Clean up URL
    window.history.replaceState({}, "", `/orders/${orderId}`);
  };

  // Handle merchant confirm for installments (2-step flow, phone ends with 4)
  const handleMerchantConfirm = async () => {
    setIsMerchantConfirming(true);
    setActionError(null);
    
    try {
      const response = await fetch("/api/payments/mono-installments/merchant-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error || "Не вдалося підтвердити розстрочку");
        setIsMerchantConfirming(false);
        return;
      }

      // Refetch order data
      const result = await getOrderDetails(orderId);
      if (result.success && result.order) {
        setOrderData(result);
        if (result.order.status === "PAID") {
          setShowAnimation(true);
          setHasShownAnimation(true);
        }
      }
      
      setIsMerchantConfirming(false);
    } catch (err) {
      console.error("Merchant confirm error:", err);
      setActionError("Сталася помилка. Спробуйте ще раз.");
      setIsMerchantConfirming(false);
    }
  };

  // Handle retry payment - create new Monobank invoice for existing order
  const handleRetryPayment = async () => {
    setIsRetrying(true);
    setRetryError(null);
    
    try {
      // Call the payment creation API directly
      const response = await fetch("/api/payments/monobank/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRetryError(data.error || "Не вдалося створити платіж");
        setIsRetrying(false);
        return;
      }

      // Redirect to Monobank payment page
      if (data.pageUrl) {
        window.location.href = data.pageUrl;
      } else {
        setRetryError("Не отримано посилання на оплату");
        setIsRetrying(false);
      }
    } catch (err) {
      console.error("Retry payment error:", err);
      setRetryError("Сталася помилка. Спробуйте ще раз.");
      setIsRetrying(false);
    }
  };

  // Handle edit order - cancel current order and create new DRAFT with same items
  const handleEditOrder = async () => {
    setIsEditing(true);
    setActionError(null);
    
    try {
      const result = await editOrderAsNewDraft(orderId);
      
      if (!result.success) {
        setActionError(result.error || "Не вдалося змінити замовлення");
        setIsEditing(false);
        return;
      }
      
      // Save delivery info to localStorage for checkout prefill
      if (result.deliveryInfo) {
        localStorage.setItem("sky_checkout_form", JSON.stringify(result.deliveryInfo));
      }
      
      // Use full page reload to ensure CartContext fetches fresh cart data
      window.location.href = "/checkout";
    } catch (err) {
      console.error("Edit order error:", err);
      setActionError("Сталася помилка. Спробуйте ще раз.");
      setIsEditing(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    setIsCancelling(true);
    setActionError(null);
    
    try {
      const result = await cancelOrder(orderId);
      
      if (!result.success) {
        setActionError(result.error || "Не вдалося скасувати замовлення");
        setIsCancelling(false);
        setShowCancelConfirm(false);
        return;
      }
      
      // Refresh order data to show cancelled status
      const updatedOrder = await getOrderDetails(orderId);
      if (updatedOrder.success) {
        setOrderData(updatedOrder);
      }
      
      setShowCancelConfirm(false);
      setIsCancelling(false);
    } catch (err) {
      console.error("Cancel order error:", err);
      setActionError("Сталася помилка. Спробуйте ще раз.");
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
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
                    
                    {/* Delivery anchor - compact summary */}
                    {order.delivery && order.delivery.city && (
                      <div className="mt-4 pt-4 border-t border-[var(--sky-border)] flex items-center gap-2 text-xs text-[var(--sky-muted)]">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        <span>
                          {order.delivery.method === "nova_poshta_warehouse" ? "Нова Пошта" :
                           order.delivery.method === "nova_poshta_courier" ? "Нова Пошта (кур'єр)" :
                           order.delivery.method === "ukrposhta" ? "Укрпошта" : "Доставка"}
                          {order.delivery.city && ` · ${order.delivery.city}`}
                          {order.delivery.address && ` · ${order.delivery.address}`}
                        </span>
                      </div>
                    )}
                  </div>
                </AnimateOnScroll>

                {/* Delivery Timeline */}
                <AnimateOnScroll variant="fadeUp" delay={0.2}>
                  <div className="mt-6 rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                    <DeliveryTimeline status={order.status} />
                    
                    {order.status !== "PAID" && (
                      <div className="space-y-2">
                        {/* Show payment failure message if last payment failed */}
                        {order.status === "PENDING_PAYMENT" && payment && 
                         (payment.status === "FAILED" || payment.status === "CANCELED") && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                            <p className="text-red-700 dark:text-red-400 font-medium">
                              Оплата не пройшла
                            </p>
                            <p className="text-red-600 dark:text-red-500 text-xs mt-1">
                              Спробуйте ще раз або оберіть інший спосіб оплати
                            </p>
                          </div>
                        )}
                        
                        {/* Show expired order message */}
                        {order.status === "EXPIRED" && (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                            <p className="text-orange-700 dark:text-orange-400 font-medium">
                              Термін оплати минув
                            </p>
                            <p className="text-orange-600 dark:text-orange-500 text-xs mt-1">
                              Замовлення не було оплачене протягом 48 годин
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm text-[var(--sky-muted)]">
                          {order.status === "PENDING_PAYMENT" 
                            ? (payment?.status === "FAILED" || payment?.status === "CANCELED")
                              ? "Натисніть кнопку нижче, щоб повторити оплату"
                              : "Після оплати ми почнемо обробку замовлення"
                            : order.status === "CANCELLED"
                            ? "Це замовлення було скасовано."
                            : order.status === "EXPIRED"
                            ? "Створіть нове замовлення, щоб продовжити."
                            : "Завершіть оплату для обробки замовлення."}
                        </p>
                      </div>
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
                          <div className="text-right">
                            <span className="text-xl font-medium text-[var(--sky-fg)]">
                              ${formatPrice(order.total)}
                            </span>
                            {order.totalUah && (
                              <p className="text-sm text-[var(--sky-muted)]">
                                {formatUahFromMinor(order.totalUah)} ₴
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    {order.delivery && (order.delivery.recipientName || order.delivery.city) && (
                      <div className="rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                        <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                          Доставка
                        </h2>

                        <div className="space-y-2 text-sm">
                          {/* Delivery method */}
                          <div className="flex justify-between">
                            <span className="text-[var(--sky-muted)]">Спосіб</span>
                            <span className="text-[var(--sky-fg)]">
                              {order.delivery.method === "nova_poshta_warehouse" ? "Нова Пошта" :
                               order.delivery.method === "nova_poshta_courier" ? "Нова Пошта (кур'єр)" :
                               order.delivery.method === "ukrposhta" ? "Укрпошта" :
                               order.delivery.method || "Самовивіз"}
                            </span>
                          </div>
                          
                          {/* City and address */}
                          {(order.delivery.city || order.delivery.address) && (
                            <div className="flex justify-between">
                              <span className="text-[var(--sky-muted)]">Адреса</span>
                              <span className="text-[var(--sky-fg)] text-right">
                                {order.delivery.city && `м. ${order.delivery.city}`}
                                {order.delivery.city && order.delivery.address && ", "}
                                {order.delivery.address}
                              </span>
                            </div>
                          )}
                          
                          {/* Recipient name */}
                          {order.delivery.recipientName && (
                            <div className="flex justify-between">
                              <span className="text-[var(--sky-muted)]">Отримувач</span>
                              <span className="text-[var(--sky-fg)]">{order.delivery.recipientName}</span>
                            </div>
                          )}
                          
                          {/* Phone */}
                          {order.delivery.phone && (
                            <div className="flex justify-between">
                              <span className="text-[var(--sky-muted)]">Телефон</span>
                              <span className="text-[var(--sky-fg)]">{order.delivery.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Comment */}
                        {order.delivery.comment && (
                          <p className="mt-3 pt-3 border-t border-[var(--sky-border)] text-xs italic text-[var(--sky-muted)]">
                            «{order.delivery.comment}»
                          </p>
                        )}
                      </div>
                    )}

                    {/* Payment Info - Standard card payment */}
                    {payment && order.paymentMethod !== "MONO_INSTALLMENTS" && (
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

                    {/* Installment Info - Покупка частинами */}
                    {order.paymentMethod === "MONO_INSTALLMENTS" && orderData.installment && (
                      <div className="rounded border border-[var(--sky-card-border)] bg-[var(--sky-card-bg)] p-6 shadow-[var(--sky-shadow)]">
                        <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                          Покупка частинами
                        </h2>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--sky-muted)]">Спосіб</span>
                            <span className="text-[var(--sky-fg)]">Monobank</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--sky-muted)]">Термін</span>
                            <span className="text-[var(--sky-fg)]">{orderData.installment.months} міс.</span>
                          </div>
                          {orderData.installment.monthlyAmount && (
                            <div className="flex justify-between">
                              <span className="text-[var(--sky-muted)]">Щомісячний платіж</span>
                              <span className="text-[var(--sky-fg)] font-medium">
                                {formatPrice(orderData.installment.monthlyAmount)} ₴
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-[var(--sky-border)]">
                            <span className="text-[var(--sky-muted)]">Статус</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              INSTALLMENT_STATUS_LABELS[orderData.installment.status]?.className || "bg-gray-100 text-gray-800"
                            }`}>
                              {INSTALLMENT_STATUS_LABELS[orderData.installment.status]?.label || orderData.installment.status}
                            </span>
                          </div>
                        </div>

                        {/* Installment status messages */}
                        {orderData.installment.status === "PENDING_CUSTOMER" && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <div className="flex items-start gap-2">
                              <svg className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                  Очікуємо підтвердження
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                  Підтвердіть заявку в застосунку monobank
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {orderData.installment.status === "PENDING_MERCHANT" && (
                          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                            <div className="flex items-start gap-2">
                              <svg className="h-5 w-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                  Потрібне підтвердження
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                                  Клієнт підтвердив заявку. Натисніть кнопку нижче для завершення.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {orderData.installment.status === "DECLINED" && (
                          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                              Заявку відхилено
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                              Спробуйте інший спосіб оплати або зверніться до служби підтримки
                            </p>
                          </div>
                        )}

                        {orderData.installment.status === "APPROVED" && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                Розстрочку схвалено!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {/* Show actions for PENDING_PAYMENT orders */}
                      {order.status === "PENDING_PAYMENT" && (
                        <>
                          {/* Installment-specific actions */}
                          {order.paymentMethod === "MONO_INSTALLMENTS" && orderData.installment ? (
                            <>
                              {/* Merchant confirm button for PENDING_MERCHANT status */}
                              {orderData.installment.status === "PENDING_MERCHANT" && (
                                <button
                                  onClick={handleMerchantConfirm}
                                  disabled={isMerchantConfirming || isEditing || isCancelling}
                                  className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                  {isMerchantConfirming ? (
                                    <>
                                      <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Підтвердження...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Підтвердити угоду
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Waiting for customer - show disabled button */}
                              {orderData.installment.status === "PENDING_CUSTOMER" && (
                                <button
                                  disabled
                                  className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] opacity-50 cursor-not-allowed"
                                >
                                  <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Очікую підтвердження...
                                </button>
                              )}

                              {/* Declined - show retry with different method */}
                              {orderData.installment.status === "DECLINED" && (
                                <button
                                  onClick={handleEditOrder}
                                  disabled={isEditing || isCancelling}
                                  className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                  {isEditing ? (
                                    <>
                                      <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Завантаження...
                                    </>
                                  ) : (
                                    "Спробувати інший спосіб"
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            /* Standard card payment actions */
                            <>
                              <button
                                onClick={handleRetryPayment}
                                disabled={isRetrying || isEditing || isCancelling}
                                className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {isRetrying ? (
                                  <>
                                    <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Перехід до оплати...
                                  </>
                                ) : (
                                  "Оплатити зараз"
                                )}
                              </button>
                              {retryError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                                  {retryError}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Edit order button - always show for PENDING_PAYMENT unless waiting for customer */}
                          {!(order.paymentMethod === "MONO_INSTALLMENTS" && 
                             orderData.installment?.status === "PENDING_CUSTOMER") && (
                            <button
                              onClick={handleEditOrder}
                              disabled={isRetrying || isEditing || isCancelling || isMerchantConfirming}
                              className="flex items-center justify-center rounded border border-[var(--sky-border)] bg-transparent px-4 py-3 text-sm font-medium text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)] disabled:opacity-50"
                            >
                              {isEditing ? (
                                <>
                                  <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Завантаження...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                  Змінити дані
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Cancel order button */}
                          {!showCancelConfirm ? (
                            <button
                              onClick={() => setShowCancelConfirm(true)}
                              disabled={isRetrying || isEditing || isCancelling || isMerchantConfirming}
                              className="flex items-center justify-center rounded border border-red-300 dark:border-red-800 bg-transparent px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                              Скасувати замовлення
                            </button>
                          ) : (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                                Ви впевнені, що хочете скасувати замовлення?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCancelOrder}
                                  disabled={isCancelling}
                                  className="flex-1 flex items-center justify-center rounded bg-red-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                  {isCancelling ? (
                                    <>
                                      <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Скасування...
                                    </>
                                  ) : (
                                    "Так, скасувати"
                                  )}
                                </button>
                                <button
                                  onClick={() => setShowCancelConfirm(false)}
                                  disabled={isCancelling}
                                  className="flex-1 rounded border border-[var(--sky-border)] px-3 py-2 text-sm font-medium text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)] disabled:opacity-50"
                                >
                                  Ні
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Show action error */}
                          {actionError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                              {actionError}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Show "Continue shopping" for PAID orders */}
                      {order.status === "PAID" && (
                        <Link
                          href="/catalog"
                          className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                        >
                          Продовжити покупки
                        </Link>
                      )}
                      
                      {/* Show "Create new order" for expired orders */}
                      {order.status === "EXPIRED" && (
                        <Link
                          href="/catalog"
                          className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                        >
                          Створити нове замовлення
                        </Link>
                      )}
                      
                      {/* Show "Go to catalog" for cancelled/other statuses */}
                      {order.status !== "PAID" && order.status !== "PENDING_PAYMENT" && order.status !== "EXPIRED" && (
                        <Link
                          href="/catalog"
                          className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                        >
                          Перейти до каталогу
                        </Link>
                      )}
                      
                      {/* Contact button - only show for non-pending orders */}
                      {order.status !== "PENDING_PAYMENT" && (
                        <Link
                          href="/contacts"
                          className="flex items-center justify-center rounded border border-[var(--sky-border)] bg-transparent px-4 py-3 text-sm font-medium text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)]"
                        >
                          Зв'язатися з нами
                        </Link>
                      )}
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

