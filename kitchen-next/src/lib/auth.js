import "server-only";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current Supabase auth user and upsert into Prisma User table.
 * Returns null for appUser if no user session found (no error thrown).
 * @returns {{ appUser: import("@prisma/client").User | null, supabaseUser: import("@supabase/supabase-js").User | null }}
 */
export async function getAppUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { appUser: null, supabaseUser: null };
  }

  const supabaseUser = data.user;
  const authUserId = supabaseUser.id;
  const email = supabaseUser.email;
  const metadata = supabaseUser.user_metadata || {};
  const googleIdentity = supabaseUser.identities?.find(
    (i) => i.provider === "google"
  )?.identity_data;
  
  const name =
    metadata.name ||
    metadata.full_name ||
    null;

  // Extract first/last name from OAuth
  const firstName =
    metadata.given_name ||
    googleIdentity?.given_name ||
    null;
  
  const lastName =
    metadata.family_name ||
    googleIdentity?.family_name ||
    null;

  // Upsert user in Prisma - only update name-related fields if current DB values are null
  const appUser = await prisma.user.upsert({
    where: { authUserId },
    update: {
      email,
      // name is always synced from OAuth
      name,
    },
    create: {
      authUserId,
      email,
      name,
      // Set firstName/lastName from OAuth on creation only
      firstName,
      lastName,
    },
  });

  return { appUser, supabaseUser };
}

/**
 * Get the current Supabase auth user and upsert into Prisma User table.
 * Throws "UNAUTHORIZED" if no user session found.
 * @returns {{ appUser: import("@prisma/client").User, supabaseUser: import("@supabase/supabase-js").User }}
 */
export async function requireAppUser() {
  const { appUser, supabaseUser } = await getAppUser();

  if (!appUser || !supabaseUser) {
    throw new Error("UNAUTHORIZED");
  }

  return { appUser, supabaseUser };
}

