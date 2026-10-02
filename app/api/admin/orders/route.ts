import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: { select: { productName: true, quantity: true, size: true } } } });
    return NextResponse.json(orders.map(({ receiptToken: _token, ...order }) => order));
  } catch { return NextResponse.json({ error: "Orders are temporarily unavailable." }, { status: 503 }); }
}
