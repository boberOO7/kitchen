"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AccountUser } from "@/app/actions/account";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/app/actions/profile";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { NameInput, isValidUkrainianName } from "@/components/ui/NameInput";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-[var(--sky-fg)]">{label}</p>
        {description && (
          <p className="mt-0.5 text-sm text-[var(--sky-fg-muted)]">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-accent)] disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? "bg-[var(--sky-accent)]" : "bg-[var(--sky-border)]"
        }`}
        style={{ borderRadius: 999 }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 bg-white shadow transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
          style={{ borderRadius: 999 }}
        />
      </button>
    </div>
  );
}

interface SettingsContentProps {
  user: AccountUser;
}

export default function SettingsContent({ user }: SettingsContentProps) {
  // Profile data state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<UserProfile | null>(null);

  // Load profile data on mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const result = await getUserProfile();
        if (result.success && result.profile) {
          const profile = result.profile;
          setFirstName(profile.firstName || "");
          setLastName(profile.lastName || "");
          setPhone(profile.phone || "");
          setEmailNotifications(profile.notificationEmailEnabled);
          setOrderUpdates(profile.notificationOrdersEnabled);
          setMarketingEmails(profile.marketingEnabled);
          setOriginalData(profile);
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
        setError("Не вдалося завантажити профіль");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Track changes
  useEffect(() => {
    if (!originalData) return;
    
    const changed =
      firstName !== (originalData.firstName || "") ||
      lastName !== (originalData.lastName || "") ||
      phone !== (originalData.phone || "") ||
      emailNotifications !== originalData.notificationEmailEnabled ||
      orderUpdates !== originalData.notificationOrdersEnabled ||
      marketingEmails !== originalData.marketingEnabled;
    
    setHasChanges(changed);
    setSaveSuccess(false); // Reset success message when form changes
  }, [firstName, lastName, phone, emailNotifications, orderUpdates, marketingEmails, originalData]);

  const handleSave = async () => {
    // Validate names before saving
    if (firstName && !isValidUkrainianName(firstName)) {
      setError("Ім'я має містити тільки українські літери");
      return;
    }
    if (lastName && !isValidUkrainianName(lastName)) {
      setError("Прізвище має містити тільки українські літери");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const result = await updateUserProfile({
        firstName,
        lastName,
        phone,
        notificationEmailEnabled: emailNotifications,
        notificationOrdersEnabled: orderUpdates,
        marketingEnabled: marketingEmails,
      });
      
      if (result.success && result.profile) {
        setOriginalData(result.profile);
        setSaveSuccess(true);
        setHasChanges(false);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.error || "Не вдалося зберегти зміни");
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
      setError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <SpinnerIcon className="h-8 w-8 text-[var(--sky-accent)]" />
        </div>
      </div>
    );
  }

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
          Налаштування
        </h1>
        <p className="mt-2 text-[var(--sky-fg-muted)]">
          Керуйте особистими даними та налаштуваннями сповіщень
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-sm text-red-500" style={{ borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Success message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-sm text-green-600 flex items-center gap-2" style={{ borderRadius: 4 }}>
          <CheckIcon className="h-4 w-4" />
          Зміни збережено
        </div>
      )}

      {/* Personal Info Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-[var(--sky-fg-muted)]" />
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Особиста інформація
          </h2>
        </div>

        <div className="border border-[var(--sky-border)] bg-[var(--sky-surface)] p-5" style={{ borderRadius: 4 }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <NameInput
              label="Ім'я"
              name="firstName"
              value={firstName}
              onChange={setFirstName}
              placeholder="Введіть ваше ім'я"
              disabled={isSaving}
            />
            <NameInput
              label="Прізвище"
              name="lastName"
              value={lastName}
              onChange={setLastName}
              placeholder="Введіть ваше прізвище"
              disabled={isSaving}
            />
            <div>
              <label className="block text-sm font-medium text-[var(--sky-fg-muted)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="w-full border border-[var(--sky-border)] bg-[var(--sky-bg)] px-3 py-2 text-sm text-[var(--sky-fg-muted)] cursor-not-allowed opacity-60"
                style={{ borderRadius: 2 }}
              />
              <p className="mt-1 text-xs text-[var(--sky-fg-muted)]">
                Email не можна змінити
              </p>
            </div>
            <PhoneInput
              label="Телефон"
              name="phone"
              value={phone}
              onChange={setPhone}
              disabled={isSaving}
              hint="Використовується для зв'язку щодо замовлень"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="mt-5 inline-flex items-center justify-center gap-2 bg-[var(--sky-accent)] px-4 py-2 text-sm font-medium text-[var(--sky-accent-fg)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 2 }}
          >
            {isSaving ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                Збереження...
              </>
            ) : (
              "Зберегти зміни"
            )}
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <BellIcon className="h-5 w-5 text-[var(--sky-fg-muted)]" />
          <h2 className="text-lg font-medium text-[var(--sky-fg)]">
            Сповіщення
          </h2>
        </div>

        <div className="border border-[var(--sky-border)] bg-[var(--sky-surface)] px-5 divide-y divide-[var(--sky-border)]" style={{ borderRadius: 4 }}>
          <Toggle
            enabled={emailNotifications}
            onChange={setEmailNotifications}
            label="Email-сповіщення"
            description="Отримувати загальні сповіщення на email"
            disabled={isSaving}
          />
          <Toggle
            enabled={orderUpdates}
            onChange={setOrderUpdates}
            label="Оновлення замовлень"
            description="Сповіщення про статус ваших замовлень"
            disabled={isSaving}
          />
          <Toggle
            enabled={marketingEmails}
            onChange={setMarketingEmails}
            label="Маркетингові листи"
            description="Отримувати інформацію про акції та новинки"
            disabled={isSaving}
          />
        </div>
        
        {hasChanges && (
          <p className="mt-2 text-xs text-[var(--sky-fg-muted)]">
            * Натисніть "Зберегти зміни" щоб застосувати налаштування
          </p>
        )}
      </section>

      {/* Danger Zone */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrashIcon className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-medium text-red-500">
            Небезпечна зона
          </h2>
        </div>

        <div className="border border-red-500/30 bg-red-500/5 p-5" style={{ borderRadius: 4 }}>
          <h3 className="font-medium text-[var(--sky-fg)]">
            Видалити акаунт
          </h3>
          <p className="mt-1 text-sm text-[var(--sky-fg-muted)]">
            Після видалення акаунту всі ваші дані будуть безповоротно втрачені.
            Ця дія не може бути скасована.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
            style={{ borderRadius: 2 }}
            // TODO: Implement account deletion
          >
            Видалити акаунт
          </button>
        </div>
      </section>
    </div>
  );
}
