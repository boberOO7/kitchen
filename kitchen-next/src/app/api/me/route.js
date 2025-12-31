import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";

export async function GET() {
  try {
    const { appUser } = await requireAppUser();

    return NextResponse.json({ ok: true, user: appUser });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    console.error("Error in /api/me:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

