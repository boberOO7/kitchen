"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { getProductImageUrl } from "@/lib/storage";
import { initiateMonobankPayment, getPendingPaymentOrder, getInstallmentOptions, getCheckoutInitialData } from "@/app/actions/checkout";
import { createAddress, type AddressData } from "@/app/actions/addresses";
import { formatPriceFromMinor } from "@/lib/currency";
import { formatUahFromMinor, convertUsdToUah } from "@/lib/nbu";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { NameInput, isValidUkrainianName } from "@/components/ui/NameInput";

function formatPrice(minorUnits: number) {
  return formatPriceFromMinor(minorUnits);
}

// Payment method type
type PaymentMethodType = "card" | "installments";

// Installment period options
const INSTALLMENT_PERIODS = [3, 6, 9, 12] as const;
type InstallmentPeriod = typeof INSTALLMENT_PERIODS[number];

// Test scenario descriptions for dev
function getTestScenarioInfo(phone: string): string {
  const lastDigit = phone.replace(/\D/g, "").slice(-1);
  switch (lastDigit) {
    case "1": return "✅ Сценарій 1: Буде схвалено через ~5 сек";
    case "2": return "⏳ Сценарій 2: Очікування підтвердження клієнта";
    case "3": return "❌ Сценарій 3: Буде відхилено через ~5 сек";
    case "4": return "🏪 Сценарій 4: Потребує підтвердження магазину";
    default: return "";
  }
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

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || ""}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
  const { cart, isLoading: cartLoading, clearCart } = useCart();

  const CHECKOUT_SESSION_KEY = "sky_checkout_session_draft";

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
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    total: number;
    itemCount: number;
    paymentStatus: string | null;
  } | null>(null);
  const [checkingPendingOrder, setCheckingPendingOrder] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");
  const [installmentMonths, setInstallmentMonths] = useState<InstallmentPeriod>(6);
  const [installmentOptions, setInstallmentOptions] = useState<Array<{
    months: number;
    monthlyAmount: number;
    totalAmount: number;
  }>>([]);
  
  // Installment flow state
  const [installmentStatus, setInstallmentStatus] = useState<string | null>(null);
  const [installmentError, setInstallmentError] = useState<string | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [pendingInstallmentOrderId, setPendingInstallmentOrderId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Exchange rate state (for UAH display)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Load all initial checkout data in a single request (optimized)
  useEffect(() => {
    async function loadInitialData() {
      // Fetch all data in one server request
      const result = await getCheckoutInitialData();
      
      // Load from sessionStorage (for preserving edits during checkout session)
      let sessionDraft: Partial<CheckoutFormData> = {};
      try {
        const savedData = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
        if (savedData) {
          sessionDraft = JSON.parse(savedData) as Partial<CheckoutFormData>;
        }
      } catch (e) {
        console.error("Failed to load session draft:", e);
      }

      // Set exchange rate
      if (result.exchangeRate) {
        setExchangeRate(result.exchangeRate.rate);
      }

      // Set saved addresses
      if (result.addresses && result.addresses.length > 0) {
        setSavedAddresses(result.addresses as AddressData[]);
      }

      // Find default address
      const defaultAddress = result.addresses?.find((a: any) => a.isDefault) || result.addresses?.[0] || null;

      // Merge priority:
      // - For name/email/phone: DB profile is source of truth (sessionStorage only if DB is empty)
      // - For city/address/delivery/comment: saved address > sessionStorage
      const addressData = defaultAddress ? {
        city: defaultAddress.city,
        address: defaultAddress.address,
        deliveryMethod: defaultAddress.deliveryMethod,
      } : null;

      const profileData = result.profile as { firstName?: string; lastName?: string; email?: string; phone?: string } | null;

      setFormData((prev) => ({
        ...prev,
        // User profile fields: DB has priority
        firstName: profileData?.firstName || sessionDraft.firstName || prev.firstName,
        lastName: profileData?.lastName || sessionDraft.lastName || prev.lastName,
        email: profileData?.email || sessionDraft.email || prev.email,
        phone: profileData?.phone || sessionDraft.phone || prev.phone,
        // Delivery fields: saved address > sessionStorage > prev
        city: addressData?.city || sessionDraft.city || prev.city,
        address: addressData?.address || sessionDraft.address || prev.address,
        deliveryMethod: addressData?.deliveryMethod || sessionDraft.deliveryMethod || prev.deliveryMethod,
        comment: sessionDraft.comment || prev.comment,
      }));

      // Set selected address if we have one
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      setIsFormLoaded(true);
    }

    loadInitialData();
  }, []);

  // Save form data to sessionStorage when it changes (for preserving edits during checkout)
  useEffect(() => {
    if (!isFormLoaded) return;
    
    try {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to save session draft:", e);
    }
  }, [formData, isFormLoaded]);

  // Check if text contains only Cyrillic characters (Ukrainian)
  // Returns the text if it's Cyrillic, empty string otherwise
  const getCyrillicOrEmpty = (text: string | undefined | null): string => {
    if (!text) return "";
    // Check if the text contains primarily Cyrillic characters
    // Allow spaces, hyphens, and apostrophes in names
    const cyrillicPattern = /^[\u0400-\u04FF\s\-'ʼ]+$/;
    return cyrillicPattern.test(text.trim()) ? text : "";
  };

  // Pre-fill form with OAuth data as a fallback (only for name fields in Cyrillic)
  // This runs after form is loaded, in case DB profile didn't have the data
  useEffect(() => {
    if (user && isFormLoaded) {
      setFormData((prev) => {
        // Only try to fill empty fields
        if (prev.firstName && prev.lastName && prev.email) return prev;
        
        const googleFirstName = user.firstName || user.name?.split(" ")[0];
        const googleLastName = user.lastName || user.name?.split(" ").slice(1).join(" ");
        
        return {
          ...prev,
          // Only fill name fields if they're in Cyrillic (Ukrainian) and currently empty
          firstName: prev.firstName || getCyrillicOrEmpty(googleFirstName),
          lastName: prev.lastName || getCyrillicOrEmpty(googleLastName),
          // Email is always fine to use
          email: prev.email || user.email || "",
        };
      });
    }
  }, [user, isFormLoaded]);

  // Check for pending orders when cart is empty
  useEffect(() => {
    async function checkPendingOrder() {
      if (!user || cartLoading) return;
      if (cart && cart.items.length > 0) return; // Cart has items, no need to check

      setCheckingPendingOrder(true);
      try {
        const result = await getPendingPaymentOrder();
        if (result.success && result.order) {
          setPendingOrder(result.order);
        }
      } catch (e) {
        console.error("Failed to check pending orders:", e);
      } finally {
        setCheckingPendingOrder(false);
      }
    }

    checkPendingOrder();
  }, [user, cart, cartLoading]);

  // Fetch installment options when cart is loaded
  useEffect(() => {
    async function fetchInstallmentOptions() {
      if (!cart || cart.items.length === 0) return;
      
      try {
        const result = await getInstallmentOptions();
        if (result.success && result.options) {
          setInstallmentOptions(result.options);
        }
      } catch (e) {
        console.error("Failed to fetch installment options:", e);
      }
    }

    fetchInstallmentOptions();
  }, [cart]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for installment status updates
  const pollInstallmentStatus = useCallback(async (orderId: string) => {
    setIsPollingStatus(true);
    setPendingInstallmentOrderId(orderId);
    
    const pollFn = async () => {
      try {
        const response = await fetch(`/api/payments/mono-installments/status?orderId=${orderId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        setInstallmentStatus(data.status);
        
        // Handle terminal statuses
        if (data.status === "APPROVED") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPollingStatus(false);
          // Clear cart after successful payment
          await clearCart();
          router.push(`/orders/${orderId}?success=true`);
        } else if (data.status === "DECLINED") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPollingStatus(false);
          setInstallmentError("Заявку на розстрочку відхилено. Спробуйте інший спосіб оплати.");
        } else if (data.status === "PENDING_MERCHANT") {
          // User needs to click merchant confirm
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPollingStatus(false);
        }
      } catch (e) {
        console.error("Failed to poll installment status:", e);
      }
    };

    // Initial poll
    await pollFn();
    
    // Start polling every 3 seconds
    pollIntervalRef.current = setInterval(pollFn, 3000);
  }, [router]);

  // Handle merchant confirm for scenario 4 (phone ends with 4)
  const handleMerchantConfirm = async () => {
    if (!pendingInstallmentOrderId) return;
    
    setIsSubmitting(true);
    setInstallmentError(null);
    
    try {
      const response = await fetch("/api/payments/mono-installments/merchant-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pendingInstallmentOrderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInstallmentError(data.error || "Не вдалося підтвердити розстрочку");
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to order page
      router.push(`/orders/${pendingInstallmentOrderId}?success=true`);
    } catch (error) {
      console.error("Merchant confirm error:", error);
      setInstallmentError("Сталася помилка. Спробуйте ще раз.");
      setIsSubmitting(false);
    }
  };


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

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Введіть ім'я";
    } else if (!isValidUkrainianName(formData.firstName)) {
      newErrors.firstName = "Використовуйте українську розкладку";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Введіть прізвище";
    } else if (!isValidUkrainianName(formData.lastName)) {
      newErrors.lastName = "Використовуйте українську розкладку";
    }
    
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
    setInstallmentError(null);
    setInstallmentStatus(null);

    try {
      // Save delivery info and initiate payment
      const result = await initiateMonobankPayment({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        deliveryMethod: formData.deliveryMethod,
        comment: formData.comment,
      });

      if (!result.success) {
        if (result.error === "UNAUTHORIZED") {
          router.push("/login?redirect=/checkout");
          return;
        }
        setSubmitError(result.error || "Помилка оформлення");
        setIsSubmitting(false);
        return;
      }

      // Save new address if checkbox is checked
      if (saveNewAddress && selectedAddressId === null && formData.city && formData.address) {
        try {
          await createAddress({
            city: formData.city,
            address: formData.address,
            deliveryMethod: formData.deliveryMethod,
          });
        } catch (e) {
          console.error("Failed to save address:", e);
          // Don't block the payment flow if address save fails
        }
      }

      // Branch based on payment method
      if (paymentMethod === "installments") {
        // Create installment application
        const response = await fetch("/api/payments/mono-installments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: result.orderId,
            customerPhone: formData.phone,
            months: installmentMonths,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setInstallmentError(data.error || "Не вдалося створити заявку на розстрочку");
          setIsSubmitting(false);
          return;
        }

        // Start polling for status updates
        setInstallmentStatus(data.status);
        setIsSubmitting(false);
        pollInstallmentStatus(result.orderId!);

      } else {
        // Standard card payment flow
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
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setSubmitError("Сталася помилка. Спробуйте ще раз.");
      setIsSubmitting(false);
    }
  };

  // Reset installment state when switching payment methods
  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    setInstallmentStatus(null);
    setInstallmentError(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPollingStatus(false);
    setPendingInstallmentOrderId(null);
  };

  // Get selected installment option
  const selectedInstallmentOption = installmentOptions.find(
    (opt) => opt.months === installmentMonths
  );

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

  // Empty cart - but check for pending orders first
  if (!cart || cart.items.length === 0) {
    // Show loading while checking for pending orders
    if (checkingPendingOrder) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-[var(--sky-bg)]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
        </div>
      );
    }

    // User has a pending order - redirect to order page automatically
    if (pendingOrder) {
      // Use effect would cause hydration issues, so we redirect client-side
      if (typeof window !== "undefined") {
        window.location.replace(`/orders/${pendingOrder.id}`);
      }
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-[var(--sky-bg)]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--sky-accent)] border-t-transparent" />
            <p className="text-[var(--sky-muted)]">Перенаправлення на ваше замовлення...</p>
          </div>
        </div>
      );
    }

    // No cart and no pending order - truly empty
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
                  <NameInput
                    label="Ім'я"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, firstName: value }));
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }}
                    required
                    error={errors.firstName}
                    autoComplete="section-contact given-name"
                    placeholder="Ваше ім'я"
                    size="large"
                  />
                  <NameInput
                    label="Прізвище"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, lastName: value }));
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                    }}
                    required
                    error={errors.lastName}
                    autoComplete="section-contact family-name"
                    placeholder="Ваше прізвище"
                    size="large"
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
                    size="large"
                  />
                </div>
              </section>

              {/* Delivery */}
              <section className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
                <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-6">
                  Доставка
                </h2>

                {/* Saved Addresses Selector */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[var(--sky-fg)] mb-2">
                      Збережені адреси
                    </label>
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-center gap-3 p-3 border cursor-pointer transition ${
                            selectedAddressId === addr.id
                              ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/5"
                              : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30"
                          }`}
                          style={{ borderRadius: 4 }}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => {
                              setSelectedAddressId(addr.id);
                              setFormData((prev) => ({
                                ...prev,
                                city: addr.city,
                                address: addr.address,
                                deliveryMethod: addr.deliveryMethod,
                              }));
                              setSaveNewAddress(false);
                            }}
                            className="sr-only"
                          />
                          <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                            selectedAddressId === addr.id
                              ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]"
                              : "border-[var(--sky-border)]"
                          }`}>
                            {selectedAddressId === addr.id && (
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {addr.label && <span className="font-medium text-sm text-[var(--sky-fg)]">{addr.label}</span>}
                              {addr.isDefault && (
                                <span className="text-xs text-[var(--sky-accent)] bg-[var(--sky-accent)]/10 px-1.5 py-0.5" style={{ borderRadius: 2 }}>
                                  Основна
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--sky-fg-muted)] truncate">
                              {addr.city}, {addr.address}
                            </p>
                          </div>
                        </label>
                      ))}
                      {/* Option to enter new address */}
                      <label
                        className={`flex items-center gap-3 p-3 border cursor-pointer transition ${
                          selectedAddressId === null
                            ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/5"
                            : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30"
                        }`}
                        style={{ borderRadius: 4 }}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          value=""
                          checked={selectedAddressId === null}
                          onChange={() => {
                            setSelectedAddressId(null);
                            setFormData((prev) => ({
                              ...prev,
                              city: "",
                              address: "",
                            }));
                          }}
                          className="sr-only"
                        />
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                          selectedAddressId === null
                            ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]"
                            : "border-[var(--sky-border)]"
                        }`}>
                          {selectedAddressId === null && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm text-[var(--sky-fg)]">Нова адреса</span>
                      </label>
                    </div>
                  </div>
                )}

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

                {/* Save Address Checkbox (only for new addresses when user is logged in) */}
                {user && selectedAddressId === null && formData.city && formData.address && (
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="h-4 w-4 border-[var(--sky-border)] text-[var(--sky-accent)] focus:ring-[var(--sky-accent)]"
                      style={{ borderRadius: 2 }}
                    />
                    <span className="text-sm text-[var(--sky-fg)]">Зберегти цю адресу</span>
                  </label>
                )}

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

            {/* Right Column - Payment Method & Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Payment Method Selection */}
              <div className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
                <h2 className="text-lg font-medium text-[var(--sky-fg)] mb-4">
                  Спосіб оплати
                </h2>
                
                {/* Payment Method Toggle */}
                <div className="space-y-3">
                  {/* Card Payment Option */}
                  <label
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition ${
                      paymentMethod === "card"
                        ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/5"
                        : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30"
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => handlePaymentMethodChange("card")}
                      className="sr-only"
                      disabled={isSubmitting || isPollingStatus}
                    />
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5 ${
                      paymentMethod === "card"
                        ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]"
                        : "border-[var(--sky-border)]"
                    }`}>
                      {paymentMethod === "card" && (
                        <CheckIcon className="h-3 w-3 text-[var(--sky-accent-fg)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5 text-[var(--sky-fg)]" />
                        <span className="font-medium text-[var(--sky-fg)]">Оплата карткою</span>
                      </div>
                      <p className="text-sm text-[var(--sky-muted)] mt-1">
                        Monobank · Visa · Mastercard
                      </p>
                    </div>
                  </label>
                  
                  {/* Installments Option */}
                  <label
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition ${
                      paymentMethod === "installments"
                        ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/5"
                        : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30"
                    }`}
                    style={{ borderRadius: 4 }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="installments"
                      checked={paymentMethod === "installments"}
                      onChange={() => handlePaymentMethodChange("installments")}
                      className="sr-only"
                      disabled={isSubmitting || isPollingStatus}
                    />
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5 ${
                      paymentMethod === "installments"
                        ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]"
                        : "border-[var(--sky-border)]"
                    }`}>
                      {paymentMethod === "installments" && (
                        <CheckIcon className="h-3 w-3 text-[var(--sky-accent-fg)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-[var(--sky-fg)]" />
                        <span className="font-medium text-[var(--sky-fg)]">Покупка частинами</span>
                      </div>
                      <p className="text-sm text-[var(--sky-muted)] mt-1">
                        Monobank · {selectedInstallmentOption ? `від ${formatPrice(selectedInstallmentOption.monthlyAmount)} ₴/міс` : "Розстрочка"}
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Installments Period Selector */}
                {paymentMethod === "installments" && (
                  <div className="mt-4 pt-4 border-t border-[var(--sky-border)]">
                    <label className="block text-sm font-medium text-[var(--sky-fg)] mb-3">
                      Термін розстрочки
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {INSTALLMENT_PERIODS.map((months) => {
                        const option = installmentOptions.find((o) => o.months === months);
                        return (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setInstallmentMonths(months)}
                            disabled={isSubmitting || isPollingStatus}
                            className={`p-3 border text-center transition ${
                              installmentMonths === months
                                ? "border-[var(--sky-accent)] bg-[var(--sky-accent)]/10 text-[var(--sky-accent)]"
                                : "border-[var(--sky-border)] hover:border-[var(--sky-fg)]/30 text-[var(--sky-fg)]"
                            } disabled:opacity-50`}
                            style={{ borderRadius: 4 }}
                          >
                            <span className="text-lg font-semibold">{months}</span>
                            <span className="block text-xs text-[var(--sky-muted)]">міс</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Monthly payment display */}
                    {selectedInstallmentOption && (
                      <div className="mt-4 p-3 bg-[var(--sky-bg)] rounded" style={{ borderRadius: 4 }}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[var(--sky-muted)]">Щомісячний платіж</span>
                          <span className="text-lg font-semibold text-[var(--sky-fg)]">
                            {formatPrice(selectedInstallmentOption.monthlyAmount)} ₴
                          </span>
                        </div>
                        <p className="text-xs text-[var(--sky-muted)] mt-2 flex items-start gap-1.5">
                          <InfoIcon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          Підтвердження в застосунку monobank
                        </p>
                      </div>
                    )}
                    
                    {/* Test scenario info (dev only) */}
                    {process.env.NODE_ENV === "development" && formData.phone && (
                      <div className="mt-3 text-xs text-[var(--sky-muted)] p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        {getTestScenarioInfo(formData.phone)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Installment Status Banner - only show for statuses that have content */}
              {installmentStatus && !["DECLINED", "CANCELED", "EXPIRED"].includes(installmentStatus) && (
                <div className={`p-4 border ${
                  installmentStatus === "APPROVED" ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20" :
                  "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                }`} style={{ borderRadius: 6 }}>
                  {installmentStatus === "PENDING_CUSTOMER" && (
                    <div className="flex items-start gap-3">
                      <SpinnerIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">
                          Очікуємо підтвердження
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                          Підтвердіть заявку в застосунку monobank
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {installmentStatus === "PENDING_MERCHANT" && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-700 dark:text-blue-400">
                            Потрібне підтвердження магазину
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                            Клієнт підтвердив заявку. Натисніть кнопку нижче для завершення.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleMerchantConfirm}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--sky-accent)] px-4 py-3 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50"
                        style={{ borderRadius: 4 }}
                      >
                        {isSubmitting ? (
                          <>
                            <SpinnerIcon className="h-4 w-4" />
                            Підтвердження...
                          </>
                        ) : (
                          "Підтвердити угоду"
                        )}
                      </button>
                    </div>
                  )}
                  
                  {installmentStatus === "APPROVED" && (
                    <div className="flex items-start gap-3">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Розстрочку схвалено!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                          Перенаправлення на сторінку замовлення...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Installment Error */}
              {installmentError && (
                <div className="p-4 border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" style={{ borderRadius: 6 }}>
                  <p className="text-sm text-red-700 dark:text-red-400">{installmentError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setInstallmentError(null);
                      setInstallmentStatus(null);
                      handlePaymentMethodChange("card");
                    }}
                    className="mt-2 text-sm text-red-600 dark:text-red-500 underline hover:no-underline"
                  >
                    Спробувати інший спосіб оплати
                  </button>
                </div>
              )}

              {/* Order Summary */}
              <div className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-6" style={{ borderRadius: 6 }}>
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
                    <div className="text-right">
                      <span className="text-xl font-semibold text-[var(--sky-fg)]">
                        ${formatPrice(cart.total)}
                      </span>
                      {exchangeRate && (
                        <div className="text-sm text-[var(--sky-muted)]">
                          ≈ {formatUahFromMinor(convertUsdToUah(cart.total, exchangeRate))} ₴
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* NBU Rate Notice */}
                {exchangeRate && (
                  <p className="text-xs text-[var(--sky-muted2)] mt-3">
                    Оплата у гривні за курсом НБУ на дату оформлення замовлення
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isPollingStatus}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-[var(--sky-accent)] px-4 py-4 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: 4 }}
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      {paymentMethod === "installments" ? "Створення заявки..." : "Перехід до оплати..."}
                    </>
                  ) : isPollingStatus ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      Очікування...
                    </>
                  ) : paymentMethod === "installments" ? (
                    <>
                      <CalendarIcon className="h-4 w-4" />
                      Оформити покупку частинами
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
