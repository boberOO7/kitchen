"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAccountSummary } from "@/hooks/useAccountSummary";
import type { ContextAction } from "@/types/account";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.348-1.86l1.682-7.041a.75.75 0 0 0-.729-.921H4.965M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
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

function ArrowRightStartOnRectangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
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

function Cog6ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ArrowPathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Action Icon Mapping
// ─────────────────────────────────────────────────────────────────────────────

function ContextActionIcon({ icon, className }: { icon?: ContextAction["icon"]; className?: string }) {
  switch (icon) {
    case "truck":
      return <TruckIcon className={className} />;
    case "card":
      return <CreditCardIcon className={className} />;
    case "cart":
      return <ShoppingCartIcon className={className} />;
    default:
      return <UserIcon className={className} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────────────────────────────────────────

function AvatarFallbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function Avatar({ 
  name, 
  avatarUrl, 
  size = "sm" 
}: { 
  name: string | null; 
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const iconSizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  
  // Get initials from name (only if name has at least one non-empty part)
  const nameParts = name?.split(" ").filter(n => n.length > 0) || [];
  const initials = nameParts.length > 0
    ? nameParts
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  // Show avatar image if available
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        className={`${sizeClasses} rounded-full object-cover border border-[var(--sky-header-border)]`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Show initials if we have a name
  if (initials) {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center rounded-full bg-[var(--sky-accent)] text-[var(--sky-accent-fg)] font-medium`}
      >
        {initials}
      </div>
    );
  }

  // Fallback: show user silhouette icon
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-[var(--sky-header-fg)]/10 text-[var(--sky-header-muted)]`}
    >
      <AvatarFallbackIcon className={iconSizeClasses} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu Item Component
// ─────────────────────────────────────────────────────────────────────────────

interface MenuItemProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  highlight?: boolean;
  danger?: boolean;
  onClose: () => void;
}

function MenuItem({ href, onClick, icon, label, description, highlight, danger, onClose }: MenuItemProps) {
  const baseClasses = `
    flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition
    ${highlight 
      ? "bg-[var(--sky-accent)]/10 text-[var(--sky-accent)] hover:bg-[var(--sky-accent)]/15" 
      : danger
        ? "text-red-500 hover:bg-red-500/10"
        : "text-[var(--sky-header-fg)] hover:bg-[var(--sky-header-fg)]/5"
    }
  `;

  const content = (
    <>
      <span className={`h-5 w-5 flex-shrink-0 ${highlight ? "text-[var(--sky-accent)]" : danger ? "text-red-500" : "text-[var(--sky-header-muted)]"}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {description && (
          <span className="block text-xs text-[var(--sky-header-muted)]">{description}</span>
        )}
      </span>
      {highlight && <ChevronRightIcon className="h-4 w-4" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClose} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => { onClick?.(); onClose(); }} className={baseClasses}>
      {content}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AccountMenu Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { user, isLoading: authLoading, signOut } = useAuth();
  const { contextAction } = useAccountSummary();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (event.key === "ArrowDown" && isOpen) {
      event.preventDefault();
      const firstItem = menuRef.current?.querySelector("a, button") as HTMLElement;
      firstItem?.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsOpen(false);
    router.push("/");
  }, [signOut, router]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Not logged in
  // ─────────────────────────────────────────────────────────────────────────

  if (!user && !authLoading) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 border border-[var(--sky-header-border)] px-3 py-2 text-xs font-medium tracking-[0.04em] text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)] hover:border-[var(--sky-header-fg)]"
        style={{ borderRadius: 2 }}
        data-cursor-magnetic
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Увійти</span>
      </Link>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex h-8 w-8 items-center justify-center animate-pulse">
        <div className="h-7 w-7 rounded-full bg-[var(--sky-header-muted)]/20" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Logged in
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 border border-[var(--sky-header-border)] px-2 py-1.5 text-xs font-medium text-[var(--sky-header-muted)] transition hover:text-[var(--sky-header-fg)] hover:border-[var(--sky-header-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky-accent)]"
        style={{ borderRadius: 2 }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-cursor-magnetic
      >
        <Avatar name={user?.name ?? null} avatarUrl={user?.avatarUrl ?? null} size="sm" />
        {/* Show name on desktop only */}
        <span className="hidden max-w-[100px] truncate sm:inline">
          {user?.name?.split(" ")[0] || "Акаунт"}
        </span>
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden border border-[var(--sky-header-border)] bg-[var(--sky-header-bg)] backdrop-blur-xl shadow-xl"
            style={{ borderRadius: 4 }}
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Info */}
            <div className="border-b border-[var(--sky-header-border)] px-3 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? null} avatarUrl={user?.avatarUrl ?? null} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--sky-header-fg)]">
                    {user?.name || "Користувач"}
                  </p>
                  <p className="truncate text-xs text-[var(--sky-header-muted)]">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Context-aware Primary Action */}
            <div className="border-b border-[var(--sky-header-border)] p-2">
              <MenuItem
                href={contextAction.href}
                icon={<ContextActionIcon icon={contextAction.icon} className="h-5 w-5" />}
                label={contextAction.label}
                highlight
                onClose={handleClose}
              />
            </div>

            {/* Menu Items */}
            <div className="p-2" role="none">
              <MenuItem
                href="/account/orders"
                icon={<ShoppingBagIcon className="h-5 w-5" />}
                label="Замовлення"
                onClose={handleClose}
              />
              <MenuItem
                href="/account/returns"
                icon={<ArrowPathIcon className="h-5 w-5" />}
                label="Повернення & підтримка"
                onClose={handleClose}
              />
              <MenuItem
                href="/account/addresses"
                icon={<MapPinIcon className="h-5 w-5" />}
                label="Збережені адреси"
                onClose={handleClose}
              />
              <MenuItem
                href="/account/settings"
                icon={<Cog6ToothIcon className="h-5 w-5" />}
                label="Налаштування"
                onClose={handleClose}
              />
            </div>

            {/* Sign Out */}
            <div className="border-t border-[var(--sky-header-border)] p-2">
              <MenuItem
                onClick={handleSignOut}
                icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
                label="Вийти"
                danger
                onClose={handleClose}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

