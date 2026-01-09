"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { getProductImageUrl } from "@/lib/storage";

import { formatPriceFromMinor } from "@/lib/currency";

function formatPrice(minorUnits) {
  return formatPriceFromMinor(minorUnits);
}

export default function CartDrawer() {
  const {
    cart,
    isLoading,
    isPending,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // Unlock scroll - called when exit animation completes
  const unlockScroll = () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };

  // Close drawer on escape key + lock scroll when open
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    
    if (isDrawerOpen) {
      document.addEventListener("keydown", handleEscape);
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Lock body scroll and compensate for scrollbar
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Note: scroll unlock is handled by onExitComplete, not here
      // This prevents scroll appearing while drawer is still animating out
    };
  }, [isDrawerOpen, closeDrawer]);

  return (
    <AnimatePresence onExitComplete={unlockScroll}>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--sky-surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--sky-border)] px-6 py-4">
              <h2 className="text-lg font-medium text-[var(--sky-fg)]">
                Кошик
              </h2>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded text-[var(--sky-muted)] transition-colors hover:bg-[var(--sky-bg-alt)] hover:text-[var(--sky-fg)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4 px-6 text-center">
                  <svg className="h-16 w-16 text-[var(--sky-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-[var(--sky-muted)]">Кошик порожній</p>
                  <button
                    onClick={closeDrawer}
                    className="mt-2 text-sm font-medium text-[var(--sky-accent)] hover:underline"
                  >
                    Продовжити покупки
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[var(--sky-border)]">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-[var(--sky-bg-alt)]">
                        {(item.product?.image || item.product?.imageKey) ? (
                          <Image
                            src={item.product.image || getProductImageUrl(item.product.imageKey)}
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
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-[var(--sky-fg)]">
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-[var(--sky-muted)] transition-colors hover:text-red-500"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <p className="text-xs text-[var(--sky-muted)]">
                          ${formatPrice(item.unitPrice)} / шт
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--sky-border)] text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)] disabled:opacity-50"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-[var(--sky-fg)]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--sky-border)] text-[var(--sky-fg)] transition-colors hover:bg-[var(--sky-bg-alt)]"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          {/* Line total */}
                          <p className="text-sm font-medium text-[var(--sky-fg)]">
                            ${formatPrice(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-[var(--sky-border)] p-6">
                {/* Subtotal */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[var(--sky-muted)]">Разом</span>
                  <span className="text-xl font-medium text-[var(--sky-fg)]">
                    ${formatPrice(cart.total)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="flex items-center justify-center rounded bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition-opacity hover:opacity-90"
                  >
                    Оформити замовлення
                  </Link>
                  <button
                    onClick={clearCart}
                    disabled={isPending}
                    className="text-sm text-[var(--sky-muted)] transition-colors hover:text-[var(--sky-fg)] disabled:opacity-50"
                  >
                    Очистити кошик
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

