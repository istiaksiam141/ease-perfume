import { hash } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminToken, setAdminCookie, assertSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const expected = process.env.ADMIN_SETUP_TOKEN;
    if (!expected || expected.length < 24) throw new HttpError(503, "First-admin setup is not configured. Set ADMIN_SETUP_TOKEN on the server.");
    const body = await request.json();
    const token = typeof body?.setupToken === "string" ? body.setupToken : "";
    const expectedBuffer = Buffer.from(expected);
    const tokenBuffer = Buffer.from(token);
    if (tokenBuffer.length !== expectedBuffer.length || !timingSafeEqual(tokenBuffer, expectedBuffer)) throw new HttpError(403, "Setup token is incorrect.");
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid admin email.");
    if (email.length > 200) throw new HttpError(400, "Admin email must be 200 characters or fewer.");
    if (password.length < 12 || password.length > 200) throw new HttpError(400, "Use an admin password between 12 and 200 characters.");
    const passwordHash = await hash(password, 12);
    const admin = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT TRUE AS "locked" FROM (SELECT pg_advisory_xact_lock(81920417)) AS advisory_lock`;
      if (await tx.admin.count() > 0) throw new HttpError(409, "An admin account already exists. Use the admin login page.");
      return tx.admin.create({ data: { email, passwordHash }, select: { id: true, email: true } });
    }, { isolationLevel: "Serializable" });
    const response = NextResponse.json({ email: admin.email }, { status: 201 });
    response.cookies.set(setAdminCookie(createAdminToken(admin.id)));
    return response;
  } catch (error) { return errorResponse(error); }
}
