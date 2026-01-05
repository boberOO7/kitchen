"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AccountUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/**
 * Get current user for account pages (server-side)
 * Returns null if not authenticated (doesn't throw)
 */
export async function getCurrentUser(): Promise<AccountUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    const supabaseUser = data.user;
    const metadata = supabaseUser.user_metadata || {};
    const googleIdentity = supabaseUser.identities?.find(
      (i) => i.provider === "google"
    )?.identity_data;

    // Extract avatar URL
    const avatarUrl =
      metadata.picture ||
      metadata.avatar_url ||
      metadata.avatarUrl ||
      googleIdentity?.picture ||
      googleIdentity?.avatar_url ||
      null;

    // Extract first/last name from Google OAuth
    const firstName =
      metadata.given_name || googleIdentity?.given_name || null;

    const lastName =
      metadata.family_name || googleIdentity?.family_name || null;

    const fullName =
      metadata.name ||
      metadata.full_name ||
      (firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName) ||
      null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: fullName,
      firstName,
      lastName,
      avatarUrl,
      createdAt: supabaseUser.created_at,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

/**
 * Require authenticated user - redirects to login if not authenticated
 */
export async function requireUser(): Promise<AccountUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}

