import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";

const COOKIE_NAME = "ease_admin";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function createAdminToken(adminId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: adminId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string) {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch { return null; }
}

export function setAdminCookie(token: string) {
  return { name: COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 60 * 60 * 12 };
}

export async function currentAdmin() {
  const jar = await cookies();
  const id = verifyAdminToken(jar.get(COOKIE_NAME)?.value);
  if (!id) return null;
  return prisma.admin.findUnique({ where: { id }, select: { id: true, email: true, isMainAdmin: true } });
}

export async function requireAdminPage() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireMainAdminPage() {
  const admin = await requireAdminPage();
  if (!admin.isMainAdmin) redirect("/admin");
  return admin;
}

export async function requireAdminApi() {
  return currentAdmin();
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    if (new URL(origin).host !== new URL(request.url).host) throw new HttpError(403, "Request origin is invalid.");
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(403, "Request origin is invalid."); }
}
