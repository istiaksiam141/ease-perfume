import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  try { assertSameOrigin(request); const response = NextResponse.json({ ok: true }); response.cookies.set({ name: "ease_admin", value: "", path: "/", maxAge: 0 }); return response; }
  catch { return NextResponse.json({ error: "Unable to sign out." }, { status: 400 }); }
}
