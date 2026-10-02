import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, stringField } from "@/lib/http";

export const dynamic = "force-dynamic";

async function requireMainAdmin() {
  const admin = await requireAdminApi();
  if (!admin) throw new HttpError(401, "Please sign in as an admin.");
  if (!admin.isMainAdmin) throw new HttpError(403, "Only the main admin can manage admin accounts.");
  return admin;
}

export async function GET() {
  try {
    await requireMainAdmin();
    const admins = await prisma.admin.findMany({ orderBy: [{ isMainAdmin: "desc" }, { createdAt: "asc" }], select: { id: true, email: true, isMainAdmin: true, createdAt: true } });
    return NextResponse.json(admins);
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireMainAdmin();
    const body = await request.json();
    const email = stringField(body?.email, "Admin email", 200).toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid admin email.");
    if (password.length < 12 || password.length > 200) throw new HttpError(400, "Use an initial password between 12 and 200 characters.");
    const passwordHash = await hash(password, 12);
    const admin = await prisma.admin.create({ data: { email, passwordHash, isMainAdmin: false }, select: { id: true, email: true, isMainAdmin: true, createdAt: true } });
    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "An admin account with that email already exists." }, { status: 409 });
    return errorResponse(error);
  }
}
