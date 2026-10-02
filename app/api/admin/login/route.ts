import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createAdminToken, setAdminCookie, assertSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    if (typeof body?.email !== "string" || body.email.length > 200 || typeof body?.password !== "string" || body.password.length > 200) throw new HttpError(400, "Enter your email and password.");
    const admin = await prisma.admin.findUnique({ where: { email: body.email.trim().toLowerCase() } });
    if (!admin || !(await compare(body.password, admin.passwordHash))) throw new HttpError(401, "Email or password is incorrect.");
    const response = NextResponse.json({ email: admin.email });
    response.cookies.set(setAdminCookie(createAdminToken(admin.id)));
    return response;
  } catch (error) { return errorResponse(error); }
}
