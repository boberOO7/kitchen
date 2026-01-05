/**
 * Checkout draft management for sessionStorage
 * Used to persist form data during a single checkout session (cleared when tab closes)
 * DB profile is the source of truth for user data, sessionStorage is just for preserving edits
 */

export const CHECKOUT_DRAFT_KEY = "sky_checkout_session_draft";

export interface CheckoutDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryMethod: string;
  comment: string;
}

/**
 * Get checkout draft from sessionStorage
 */
export function getCheckoutDraft(): Partial<CheckoutDraft> | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as Partial<CheckoutDraft>;
  } catch (e) {
    console.error("Failed to read checkout draft:", e);
    return null;
  }
}

/**
 * Save checkout draft to sessionStorage
 */
export function saveCheckoutDraft(data: Partial<CheckoutDraft>): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save checkout draft:", e);
  }
}

/**
 * Clear checkout draft from sessionStorage
 */
export function clearCheckoutDraft(): void {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch (e) {
    console.error("Failed to clear checkout draft:", e);
  }
}
