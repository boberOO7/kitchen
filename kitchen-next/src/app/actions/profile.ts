"use server";

import { prisma } from "@/lib/prisma";
import { requireAppUser, getAppUser } from "@/lib/auth";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  notificationEmailEnabled: boolean;
  notificationOrdersEnabled: boolean;
  marketingEnabled: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  notificationEmailEnabled?: boolean;
  notificationOrdersEnabled?: boolean;
  marketingEnabled?: boolean;
}

/**
 * Normalize name to title case (handles compound names like "Анна-Марія")
 * "іван" → "Іван"
 * "ПЕТРЕНКО" → "Петренко"  
 * "анна-марія" → "Анна-Марія"
 * "о'коннор" → "О'Коннор"
 */
function normalizeNameCase(name: string): string {
  if (!name) return name;
  
  // Split by hyphen and apostrophe variants, normalize each part
  return name
    .toLowerCase()
    .split(/(-|'|ʼ|')/)
    .map((part, index) => {
      // Keep separators as-is
      if (part === '-' || part === "'" || part === 'ʼ' || part === "'") {
        return part;
      }
      // Capitalize first letter of each part
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Get the current user's profile with notification settings
 */
export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    return {
      success: true,
      profile: {
        id: appUser.id,
        email: appUser.email,
        firstName: appUser.firstName,
        lastName: appUser.lastName,
        phone: appUser.phone,
        notificationEmailEnabled: appUser.notificationEmailEnabled,
        notificationOrdersEnabled: appUser.notificationOrdersEnabled,
        marketingEnabled: appUser.marketingEnabled,
      },
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("getUserProfile error:", error);
    return { success: false, error: "Не вдалося завантажити профіль" };
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(data: UpdateProfileData): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Sanitize and validate phone number
    let phone = data.phone;
    if (phone) {
      // Remove all non-digit characters except +
      phone = phone.replace(/[^\d+]/g, "");
      // Validate Ukrainian phone format
      if (phone && !/^\+380\d{9}$/.test(phone)) {
        return { success: false, error: "Невірний формат телефону" };
      }
    }

    // Build update data object with only provided fields
    const updateData: Partial<UpdateProfileData> = {};
    
    if (data.firstName !== undefined) {
      const trimmed = data.firstName.trim();
      updateData.firstName = trimmed ? normalizeNameCase(trimmed) : null;
    }
    if (data.lastName !== undefined) {
      const trimmed = data.lastName.trim();
      updateData.lastName = trimmed ? normalizeNameCase(trimmed) : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }
    if (data.notificationEmailEnabled !== undefined) {
      updateData.notificationEmailEnabled = data.notificationEmailEnabled;
    }
    if (data.notificationOrdersEnabled !== undefined) {
      updateData.notificationOrdersEnabled = data.notificationOrdersEnabled;
    }
    if (data.marketingEnabled !== undefined) {
      updateData.marketingEnabled = data.marketingEnabled;
    }

    const updatedUser = await prisma.user.update({
      where: { id: appUser.id },
      data: updateData,
    });

    return {
      success: true,
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        notificationEmailEnabled: updatedUser.notificationEmailEnabled,
        notificationOrdersEnabled: updatedUser.notificationOrdersEnabled,
        marketingEnabled: updatedUser.marketingEnabled,
      },
    };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, error: "UNAUTHORIZED" };
    }
    console.error("updateUserProfile error:", error);
    return { success: false, error: "Не вдалося зберегти профіль" };
  }
}

/**
 * Merge checkout draft from localStorage into user profile
 * Called after user logs in to optionally save their guest checkout info
 */
export async function mergeCheckoutDraftToProfile(draftData: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{
  success: boolean;
  merged: boolean;
  error?: string;
}> {
  try {
    const { appUser } = await requireAppUser();

    // Only merge if user profile is missing these fields
    const updateData: Partial<UpdateProfileData> = {};

    if (draftData.firstName && !appUser.firstName) {
      updateData.firstName = normalizeNameCase(draftData.firstName.trim());
    }
    if (draftData.lastName && !appUser.lastName) {
      updateData.lastName = normalizeNameCase(draftData.lastName.trim());
    }
    if (draftData.phone && !appUser.phone) {
      // Validate phone format
      const phone = draftData.phone.replace(/[^\d+]/g, "");
      if (/^\+380\d{9}$/.test(phone)) {
        updateData.phone = phone;
      }
    }

    // If nothing to update, return success but not merged
    if (Object.keys(updateData).length === 0) {
      return { success: true, merged: false };
    }

    await prisma.user.update({
      where: { id: appUser.id },
      data: updateData,
    });

    return { success: true, merged: true };
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return { success: false, merged: false, error: "UNAUTHORIZED" };
    }
    console.error("mergeCheckoutDraftToProfile error:", error);
    return { success: false, merged: false, error: "Не вдалося об'єднати дані" };
  }
}

/**
 * Get user profile data for checkout pre-fill
 * Returns both DB profile and any OAuth metadata for names/email
 */
export async function getProfileForCheckout(): Promise<{
  success: boolean;
  data?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  error?: string;
}> {
  try {
    const { appUser, supabaseUser } = await getAppUser();

    if (!appUser || !supabaseUser) {
      return { success: false, error: "UNAUTHORIZED" };
    }

    const metadata = supabaseUser.user_metadata || {};
    const googleIdentity = supabaseUser.identities?.find(
      (i) => i.provider === "google"
    )?.identity_data;

    // Priority: DB profile > OAuth metadata
    const firstName =
      appUser.firstName ||
      metadata.given_name ||
      googleIdentity?.given_name ||
      "";

    const lastName =
      appUser.lastName ||
      metadata.family_name ||
      googleIdentity?.family_name ||
      "";

    return {
      success: true,
      data: {
        firstName,
        lastName,
        email: appUser.email,
        phone: appUser.phone || "",
      },
    };
  } catch (error: any) {
    console.error("getProfileForCheckout error:", error);
    return { success: false, error: "Не вдалося завантажити профіль" };
  }
}

