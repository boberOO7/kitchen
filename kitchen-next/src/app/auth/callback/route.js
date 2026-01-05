import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAppUser } from "@/lib/auth";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Support both "next" and "redirect" parameters
  const redirectTo = searchParams.get("redirect") ?? searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Upsert user into Prisma User table
      try {
        await requireAppUser();
      } catch (e) {
        console.error("Failed to upsert user:", e);
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Redirect to home on error or missing code
  return NextResponse.redirect(`${origin}/`);
}

