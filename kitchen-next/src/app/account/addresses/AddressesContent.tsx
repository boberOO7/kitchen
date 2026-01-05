"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AccountUser } from "@/app/actions/account";
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressData,
  type CreateAddressInput,
} from "@/app/actions/addresses";
import { DELIVERY_METHOD_LABELS } from "@/lib/delivery";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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

const DELIVERY_METHODS = [
  { value: "nova_poshta_warehouse", label: "Нова Пошта (Відділення)" },
  { value: "nova_poshta_courier", label: "Нова Пошта (Кур'єр)" },
  { value: "ukrposhta", label: "Укрпошта" },
];

interface AddressFormProps {
  initialData?: AddressData;
  onSave: (data: CreateAddressInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function AddressForm({ initialData, onSave, onCancel, isSaving }: AddressFormProps) {
  const [label, setLabel] = useState(initialData?.label || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [deliveryMethod, setDeliveryMethod] = useState(initialData?.deliveryMethod || "nova_poshta_warehouse");
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!city.trim()) {
      setError("Вкажіть місто");
      return;
    }
    if (!address.trim()) {
      setError("Вкажіть адресу або номер відділення");
      return;
    }

    try {
      await onSave({
        label: label.trim() || undefined,
        city: city.trim(),
        address: address.trim(),
        deliveryMethod,
        isDefault,
      });
    } catch (e: any) {
      setError(e.message || "Помилка збереження");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-sm text-red-500" style={{ borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
          Назва адреси <span className="text-[var(--sky-fg-muted)] font-normal">(опціонально)</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Напр. Дім, Робота"
          disabled={isSaving}
          className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-3 py-2 text-sm text-[var(--sky-fg)] placeholder-[var(--sky-fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 disabled:opacity-60"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
          Спосіб доставки <span className="text-red-500">*</span>
        </label>
        <select
          value={deliveryMethod}
          onChange={(e) => setDeliveryMethod(e.target.value)}
          disabled={isSaving}
          className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-3 py-2 text-sm text-[var(--sky-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 disabled:opacity-60"
          style={{ borderRadius: 2 }}
        >
          {DELIVERY_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
          Місто <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Введіть місто"
          disabled={isSaving}
          className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-3 py-2 text-sm text-[var(--sky-fg)] placeholder-[var(--sky-fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 disabled:opacity-60"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--sky-fg)] mb-1.5">
          {deliveryMethod === "nova_poshta_courier" ? "Адреса" : "Номер відділення"} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={deliveryMethod === "nova_poshta_courier" ? "Вулиця, будинок, квартира" : "Напр. №5 або №123"}
          disabled={isSaving}
          className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-3 py-2 text-sm text-[var(--sky-fg)] placeholder-[var(--sky-fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--sky-accent)]/50 disabled:opacity-60"
          style={{ borderRadius: 2 }}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={isSaving}
          className="h-4 w-4 border-[var(--sky-border)] text-[var(--sky-accent)] focus:ring-[var(--sky-accent)]"
          style={{ borderRadius: 2 }}
        />
        <span className="text-sm text-[var(--sky-fg)]">Зробити основною адресою</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--sky-accent)] px-4 py-2 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50"
          style={{ borderRadius: 2 }}
        >
          {isSaving ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Збереження...
            </>
          ) : (
            "Зберегти"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-[var(--sky-fg-muted)] border border-[var(--sky-border)] hover:bg-[var(--sky-surface-hover)] transition disabled:opacity-50"
          style={{ borderRadius: 2 }}
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}

interface AddressCardProps {
  address: AddressData;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDeleting: boolean;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, isDeleting }: AddressCardProps) {
  return (
    <div className={`border bg-[var(--sky-surface)] p-4 transition ${address.isDefault ? "border-[var(--sky-accent)]" : "border-[var(--sky-border)]"}`} style={{ borderRadius: 4 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {address.label && (
              <span className="font-medium text-[var(--sky-fg)]">{address.label}</span>
            )}
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--sky-accent)] bg-[var(--sky-accent)]/10 px-2 py-0.5" style={{ borderRadius: 2 }}>
                <StarIcon className="h-3 w-3" filled />
                Основна
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--sky-fg-muted)]">
            {DELIVERY_METHOD_LABELS[address.deliveryMethod] || address.deliveryMethod}
          </p>
          <p className="text-sm text-[var(--sky-fg)] mt-1">
            {address.city}, {address.address}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!address.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              title="Зробити основною"
              className="p-2 text-[var(--sky-fg-muted)] hover:text-[var(--sky-accent)] hover:bg-[var(--sky-accent)]/10 transition"
              style={{ borderRadius: 4 }}
            >
              <StarIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            title="Редагувати"
            className="p-2 text-[var(--sky-fg-muted)] hover:text-[var(--sky-fg)] hover:bg-[var(--sky-surface-hover)] transition"
            style={{ borderRadius: 4 }}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            title="Видалити"
            className="p-2 text-[var(--sky-fg-muted)] hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
            style={{ borderRadius: 4 }}
          >
            {isDeleting ? <SpinnerIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddressesContentProps {
  user: AccountUser;
}

export default function AddressesContent({ user }: AddressesContentProps) {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load addresses
  const loadAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserAddresses();
      if (result.success && result.addresses) {
        setAddresses(result.addresses);
      } else {
        setError(result.error || "Не вдалося завантажити адреси");
      }
    } catch (e) {
      setError("Помилка завантаження");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSave = async (data: CreateAddressInput) => {
    setIsSaving(true);
    try {
      if (editingAddress) {
        const result = await updateAddress(editingAddress.id, data);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await createAddress(data);
        if (!result.success) {
          throw new Error(result.error);
        }
      }
      await loadAddresses();
      setShowForm(false);
      setEditingAddress(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити цю адресу?")) return;
    
    setDeletingId(id);
    try {
      const result = await deleteAddress(id);
      if (result.success) {
        await loadAddresses();
      } else {
        setError(result.error || "Не вдалося видалити");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const result = await setDefaultAddress(id);
      if (result.success) {
        await loadAddresses();
      } else {
        setError(result.error || "Не вдалося встановити як основну");
      }
    } catch (e) {
      setError("Помилка");
    }
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
      {/* Back link */}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm text-[var(--sky-fg-muted)] hover:text-[var(--sky-fg)] transition mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Назад до акаунту
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[var(--sky-fg)] sm:text-3xl">
          Збережені адреси
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Керуйте адресами доставки для швидкого оформлення замовлень
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-sm text-red-500" style={{ borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showForm || editingAddress) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[var(--sky-bg)] p-6" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[var(--sky-fg)]">
                {editingAddress ? "Редагувати адресу" : "Додати адресу"}
              </h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingAddress(null); }}
                className="p-1 text-[var(--sky-fg-muted)] hover:text-[var(--sky-fg)] transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <AddressForm
              initialData={editingAddress || undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingAddress(null); }}
              isSaving={isSaving}
            />
          </div>
        </div>
      )}

      {/* Addresses Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Адреси доставки
          </h2>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--sky-accent)] hover:text-[var(--sky-accent)]/80 transition"
          >
            <PlusIcon className="h-4 w-4" />
            Додати адресу
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <SpinnerIcon className="h-8 w-8 text-[var(--sky-accent)]" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-[var(--sky-border)] bg-[var(--sky-surface)] px-6 py-10 text-center" style={{ borderRadius: 4 }}>
            <div className="flex h-12 w-12 items-center justify-center bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] mb-3" style={{ borderRadius: 8 }}>
              <MapPinIcon className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-[var(--sky-fg)]">
              Немає збережених адрес
            </h3>
            <p className="mt-1.5 text-sm text-[var(--sky-fg-muted)] max-w-sm">
              Додайте адресу доставки для швидшого оформлення замовлень
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-[var(--sky-accent)] px-4 py-2 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90"
              style={{ borderRadius: 2 }}
            >
              <PlusIcon className="h-4 w-4" />
              Додати першу адресу
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => setEditingAddress(address)}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
                isDeleting={deletingId === address.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
