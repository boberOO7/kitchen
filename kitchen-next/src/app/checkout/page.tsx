"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { getProductImageUrl } from "@/lib/storage";
import { initiateMonobankPayment } from "@/app/actions/checkout";
import { formatPriceFromMinor } from "@/lib/currency";

function formatPrice(minorUnits: number) {
  return formatPriceFromMinor(minorUnits);
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Input Component
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  autoComplete?: string;
}

function Input({ label, name, type = "text", placeholder, value, onChange, required, error, autoComplete }: InputProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        data-form-type="other"
        data-lpignore="true"
        className={`w-full border bg-[var(--sky-bg)] px-4 py-3 text-sm text-[var(--sky-fg)] placeholder-[var(--sky-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 ${
          error ? "border-red-500" : "border-[var(--sky-border)]"
        }`}
        style={{ borderRadius: 4 }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone Input with Persistent Mask
// ─────────────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  autoCompleteSection?: string;
}

// Map digit count to cursor position in formatted string "+380 (XX) XXX XX XX"
// Format positions: +380 (XX) XXX XX XX
//                   012345678901234567890
//                             1111111111
function getCursorPosition(digitCount: number): number {
  // After N digits, cursor should be at:
  // 0 → 6  (after "(")
  // 1 → 7  (after first digit)
  // 2 → 10 (after ") ", before 3rd digit)
  // 3 → 11
  // 4 → 12
  // 5 → 14 (after " ", before 6th digit)
  // 6 → 15
  // 7 → 17 (after " ", before 8th digit)
  // 8 → 18
  // 9 → 19 (end)
  const positions = [6, 7, 10, 11, 12, 14, 15, 17, 18, 19];
  return positions[Math.min(digitCount, 9)];
}

function PhoneInput({ label, name, value, onChange, required, error, autoCompleteSection }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Extract only digits after +380
  const digits = value.replace(/\D/g, "").replace(/^380/, "").replace(/^0/, "").slice(0, 9);
  
  // Calculate cursor position based on digit count
  const cursorPos = getCursorPosition(digits.length);
  
  // Use useLayoutEffect to set cursor position synchronously before paint
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && isFocused && document.activeElement === input) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
  }, [cursorPos, digits, isFocused]);

  // Process any phone number format into our format (for autocomplete)
  const processPhoneNumber = (input: string): string => {
    // Remove all non-digits
    let allDigits = input.replace(/\D/g, "");
    
    // Handle various formats:
    // +380XXXXXXXXX -> XXXXXXXXX
    // 380XXXXXXXXX -> XXXXXXXXX
    // 0XXXXXXXXX -> XXXXXXXXX
    if (allDigits.startsWith("380")) {
      allDigits = allDigits.slice(3);
    }
    if (allDigits.startsWith("0")) {
      allDigits = allDigits.slice(1);
    }
    
    // Limit to first 9 digits
    return allDigits.slice(0, 9);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const newDigits = processPhoneNumber(inputValue);
    
    // If nothing changed, skip update
    if (newDigits === digits) {
      return;
    }
    
    onChange(newDigits ? `+380${newDigits}` : "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to work properly
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits.length > 0) {
        const newDigits = digits.slice(0, -1);
        onChange(newDigits ? `+380${newDigits}` : "");
      }
    }
    
    // Prevent cursor from moving with arrow keys
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    const input = inputRef.current;
    if (input) {
      requestAnimationFrame(() => {
        input.setSelectionRange(cursorPos, cursorPos);
      });
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = () => {
    const input = inputRef.current;
    if (input) {
      input.setSelectionRange(cursorPos, cursorPos);
    }
  };

  // Build display with mask: digits shown, rest as underscores
  const d = digits.padEnd(9, "_");
  const displayValue = `+380 (${d[0]}${d[1]}) ${d[2]}${d[3]}${d[4]} ${d[5]}${d[6]} ${d[7]}${d[8]}`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="tel"
          id={name}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          required={required}
          autoComplete={autoCompleteSection ? `${autoCompleteSection} tel` : "tel"}
          className={`w-full border bg-[var(--sky-bg)] px-4 py-3 text-sm font-mono tracking-wide text-[var(--sky-fg)] transition focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 ${
            error ? "border-red-500" : "border-[var(--sky-border)]"
          }`}
          style={{ borderRadius: 4, caretColor: "var(--sky-fg)" }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Method Options
// ─────────────────────────────────────────────────────────────────────────────

const deliveryMethods = [
  {
    id: "nova_poshta_warehouse",
    name: "Нова Пошта",
    description: "Самовивіз з відділення",
    price: 0,
    time: "2-3 дні",
  },
  {
    id: "nova_poshta_courier",
    name: "Нова Пошта Кур'єр",
    description: "Доставка за адресою",
    price: 0,
    time: "2-3 дні",
  },
  {
    id: "ukrposhta",
    name: "Укрпошта",
    description: "Доставка поштою",
    price: 0,
    time: "5-7 днів",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryMethod: string;
  comment: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    deliveryMethod: "nova_poshta_warehouse",
    comment: "",
  });

  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill form with user data from Google OAuth
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        // Use firstName/lastName from Google, or fallback to splitting full name
        firstName: user.firstName || user.name?.split(" ")[0] || prev.firstName,
        lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CheckoutFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutFormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Введіть ім'я";
    if (!formData.lastName.trim()) newErrors.lastName = "Введіть прізвище";
    if (!formData.email.trim()) {
      newErrors.email = "Введіть email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Невірний формат email";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Введіть телефон";
    } else if (!/^\+380\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Введіть повний номер телефону";
    }
    if (!formData.city.trim()) newErrors.city = "Введіть місто";
    if (!formData.address.trim()) newErrors.address = "Введіть адресу або відділення";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // TODO: Save delivery info to order before payment
      // For now, go directly to payment
      const result = await initiateMonobankPayment();

      if (!result.success) {
        if (result.error === "UNAUTHORIZED") {
          router.push("/login?redirect=/checkout");
          return;
        }
        setSubmitError(result.error || "Помилка оформлення");
        setIsSubmitting(false);
        return;
      }

      // Call API to create Monobank invoice
      const response = await fetch("/api/payments/monobank/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: result.orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "Не вдалося створити платіж");
        setIsSubmitting(false);
        return;
      }

      // Redirect to Monobank payment page
      if (data.pageUrl) {
        window.location.href = data.pageUrl;
      } else {
        setSubmitError("Не отримано посилання на оплату");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setSubmitError("Сталася помилка. Спробуйте ще раз.");
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--sky-bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 bg-[var(--sky-bg)]">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)]">Увійдіть в акаунт</h1>
        <p className="text-[var(--sky-muted)] text-center max-w-md">
          Для оформлення замовлення необхідно увійти в систему
        </p>
        <Link
          href="/login?redirect=/checkout"
          className="mt-4 inline-flex items-center justify-center bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
          style={{ borderRadius: 4 }}
        >
          Увійти
        </Link>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 bg-[var(--sky-bg)]">
        <svg className="h-24 w-24 text-[var(--sky-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)]">Кошик порожній</h1>
        <p className="text-[var(--sky-muted)] text-center max-w-md">
          Додайте товари з каталогу, щоб оформити замовлення
        </p>
        <Link
          href="/catalog"
          className="mt-4 inline-flex items-center justify-center bg-[var(--sky-accent)] px-6 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
          style={{ borderRadius: 4 }}
        >
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sky-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--sky-border)] bg-[var(--sky-surface)]">
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-[var(--sky-muted)] hover:text-[var(--sky-fg)] transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Повернутися до кошика
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)] sm:text-3xl mb-8">
          Оформлення замовлення
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <section className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
                <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-6">
                  Контактні дані
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Ім'я"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    error={errors.firstName}
                    autoComplete="section-contact given-name"
                    placeholder="Ваше ім'я"
                  />
                  <Input
                    label="Прізвище"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    error={errors.lastName}
                    autoComplete="section-contact family-name"
                    placeholder="Ваше прізвище"
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    error={errors.email}
                    autoComplete="section-contact email"
                  />
                  <PhoneInput
                    label="Телефон"
                    name="phone"
                    value={formData.phone}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, phone: value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    required
                    error={errors.phone}
                    autoCompleteSection="section-contact"
                  />
                </div>
              </section>

              {/* Delivery */}
              <section className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
                <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-6">
                  Доставка
                </h2>

                {/* Delivery Methods */}
                <div className="space-y-3 mb-6">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 border cursor-pointer transition ${
                        formData.deliveryMethod === method.id
                          ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/5"
                          : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30"
                      }`}
                      style={{ borderRadius: 4 }}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={method.id}
                        checked={formData.deliveryMethod === method.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        formData.deliveryMethod === method.id
                          ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]"
                          : "border-[var(--sky-border)]"
                      }`}>
                        {formData.deliveryMethod === method.id && (
                          <CheckIcon className="h-3 w-3 text-[var(--sky-accent-fg)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--sky-fg)]">{method.name}</p>
                        <p className="text-sm text-[var(--sky-muted)]">{method.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[var(--sky-fg)]">
                          {method.price === 0 ? "Безкоштовно" : `${method.price} ₴`}
                        </p>
                        <p className="text-sm text-[var(--sky-muted)]">{method.time}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Address Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Місто"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    error={errors.city}
                    placeholder="Київ"
                    autoComplete="section-shipping address-level2"
                  />
                  <Input
                    label={formData.deliveryMethod === "nova_poshta_warehouse" ? "Відділення Нової Пошти" : "Адреса доставки"}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    error={errors.address}
                    placeholder={formData.deliveryMethod === "nova_poshta_warehouse" ? "№1" : "вул. Хрещатик, 1, кв. 10"}
                    autoComplete="section-shipping street-address"
                  />
                </div>

                {/* Comment */}
                <div className="mt-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
                    Коментар до замовлення
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Додаткова інформація для доставки..."
                    className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-4 py-3 text-sm text-[var(--sky-fg)] placeholder-[var(--sky-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 resize-none"
                    style={{ borderRadius: 4 }}
                  />
                </div>
              </section>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
                <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                  Ваше замовлення
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-[var(--sky-bg)]" style={{ borderRadius: 4 }}>
                        {item.product?.imageKey ? (
                          <Image
                            src={getProductImageUrl(item.product.imageKey)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[var(--sky-muted)]">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--sky-fg)] truncate">{item.name}</p>
                        <p className="text-xs text-[var(--sky-muted)]">
                          {item.quantity} × ${formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[var(--sky-fg)]">
                        ${formatPrice(item.total)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-[var(--sky-border)] pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--sky-muted)]">Товари ({cart.itemCount})</span>
                    <span className="text-[var(--sky-fg)]">${formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--sky-muted)]">Доставка</span>
                    <span className="text-[var(--sky-fg)]">Безкоштовно</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[var(--sky-border)]">
                    <span className="text-lg font-medium text-[var(--sky-fg)]">Разом</span>
                    <span className="text-xl font-semibold text-[var(--sky-fg)]">
                      ${formatPrice(cart.total)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[var(--sky-accent)] px-4 py-4 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: 4 }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Перехід до оплати...
                    </>
                  ) : (
                    <>
                      <LockIcon className="h-4 w-4" />
                      Оплатити замовлення
                    </>
                  )}
                </button>

                {submitError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-center text-sm text-red-500" style={{ borderRadius: 4 }}>
                    {submitError}
                  </div>
                )}

                {/* Consent Notice */}
                <div className="mt-4 text-xs text-[var(--sky-muted)]">
                  <p>Підтверджуючи замовлення, ви приймаєте:</p>
                  <ul className="mt-1.5 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="text-[var(--sky-muted2)]">•</span>
                      <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--sky-fg)] transition">
                        Політику конфіденційності
                      </Link>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-[var(--sky-muted2)]">•</span>
                      <Link href="/terms" className="underline underline-offset-2 hover:text-[var(--sky-fg)] transition">
                        Умови використання
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

