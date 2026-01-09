"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { getProductImageUrl } from "@/lib/storage";
import { formatPriceFromMinor } from "@/lib/currency";
import { formatUahFromMinor } from "@/lib/nbu";

function formatPrice(minorUnits: number) {
  return formatPriceFromMinor(minorUnits);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  product: {
    id: string;
    name: string;
    imageKey: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  totalUah: number | null;  // UAH amount (stored at order time)
  exchangeRate: number | null;  // Exchange rate at order time
  currency: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  items: OrderItem[];
  payment: {
    id: string;
    status: string;
    provider: string;
  } | null;
}

interface OrdersContentProps {
  orders: Order[];
}

export default function OrdersContent({ orders }: OrdersContentProps) {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status"); // "pending" or null for all

  // Filter orders based on status param
  const filteredOrders = statusFilter === "pending"
    ? orders.filter(order => order.status === "PENDING_PAYMENT")
    : orders;
  
  const showingPendingOnly = statusFilter === "pending";

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm text-[var(--sky-muted)] hover:text-[var(--sky-fg)] transition mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Назад до акаунту
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)] sm:text-3xl">
          {showingPendingOnly ? "Незавершені замовлення" : "Мої замовлення"}
        </h1>
        <p className="mt-2 text-[var(--sky-muted)]">
          {showingPendingOnly 
            ? "Замовлення, які очікують оплати"
            : "Переглядайте історію та відстежуйте статус ваших замовлень"
          }
        </p>
        {/* Filter toggle */}
        {orders.length > 0 && (
          <div className="mt-4 flex gap-2">
            <Link
              href="/account/orders"
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                !showingPendingOnly
                  ? "bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                  : "bg-[var(--sky-surface)] text-[var(--sky-muted)] hover:text-[var(--sky-fg)]"
              }`}
            >
              Всі
            </Link>
            <Link
              href="/account/orders?status=pending"
              className={`px-3 py-1.5 text-sm rounded-full transition ${
                showingPendingOnly
                  ? "bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                  : "bg-[var(--sky-surface)] text-[var(--sky-muted)] hover:text-[var(--sky-fg)]"
              }`}
            >
              Очікують оплати
            </Link>
          </div>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const firstItem = order.items[0];
            const firstItemImage = firstItem?.product?.imageKey;
            const shortOrderId = order.id.slice(0, 8).toUpperCase();

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block border border-[var(--sky-border)] bg-[var(--sky-surface)] p-4 sm:p-6 transition hover:border-[var(--sky-fg)]/30 hover:bg-[var(--sky-bg)]"
                style={{ borderRadius: 6 }}
              >
                <div className="flex gap-4">
                  {/* Order Image Preview */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden bg-[var(--sky-bg)]" style={{ borderRadius: 4 }}>
                    {firstItemImage ? (
                      <Image
                        src={getProductImageUrl(firstItemImage)}
                        alt={firstItem?.name || "Товар"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--sky-muted)]">
                        <ShoppingBagIcon className="h-6 w-6" />
                      </div>
                    )}
                    {order.items.length > 1 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        +{order.items.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[var(--sky-fg)]">
                          Замовлення #{shortOrderId}
                        </p>
                        <p className="text-sm text-[var(--sky-muted)] mt-0.5">
                          {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "товар" : order.itemCount < 5 ? "товари" : "товарів"}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-medium text-[var(--sky-fg)]">
                          ${formatPrice(order.total)}
                        </p>
                        {order.totalUah && (
                          <p className="text-sm text-[var(--sky-muted)]">
                            {formatUahFromMinor(order.totalUah)} ₴
                          </p>
                        )}
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-[var(--sky-muted)]" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State - filter has no results but there are orders */}
      {orders.length > 0 && filteredOrders.length === 0 && showingPendingOnly && (
        <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-8 py-16 text-center" style={{ borderRadius: 4 }}>
          <div className="flex h-16 w-16 items-center justify-center bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 mb-4" style={{ borderRadius: 8 }}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Всі замовлення оплачені!
          </h2>
          <p className="mt-2 text-sm text-[var(--sky-muted)] max-w-sm">
            У вас немає замовлень, які очікують оплати.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 inline-flex items-center justify-center bg-[var(--sky-accent)] px-5 py-2.5 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
            style={{ borderRadius: 4 }}
          >
            Показати всі замовлення
          </Link>
        </div>
      )}

      {/* Empty State - no orders at all */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-8 py-16 text-center" style={{ borderRadius: 4 }}>
          <div className="flex h-16 w-16 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] mb-4" style={{ borderRadius: 8 }}>
            <ShoppingBagIcon className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            У вас ще немає замовлень
          </h2>
          <p className="mt-2 text-sm text-[var(--sky-muted)] max-w-sm">
            Коли ви зробите перше замовлення, воно з'явиться тут. Почніть з перегляду нашого каталогу.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex items-center justify-center bg-[var(--sky-accent)] px-5 py-2.5 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
            style={{ borderRadius: 4 }}
          >
            Перейти до каталогу
          </Link>
        </div>
      )}
    </div>
  );
}

