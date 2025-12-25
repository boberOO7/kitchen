import "server-only";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current Supabase auth user and upsert into Prisma User table.
 * Throws "UNAUTHORIZED" if no user session found.
 * @returns {{ appUser: import("@prisma/client").User, supabaseUser: import("@supabase/supabase-js").User }}
 */
export async function requireAppUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("UNAUTHORIZED");
  }

  const supabaseUser = data.user;
  const authUserId = supabaseUser.id;
  const email = supabaseUser.email;
  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.full_name ||
    null;

  // Upsert user in Prisma
  const appUser = await prisma.user.upsert({
    where: { authUserId },
    update: {
      email,
      name,
    },
    create: {
      authUserId,
      email,
      name,
    },
  });

  return { appUser, supabaseUser };
}

