import { NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const statuses = Object.values(OrderStatus);

export async function GET(_request: Request, { params }: Context) {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { orderNumber: id }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const { receiptToken: _token, ...safeOrder } = order;
    return NextResponse.json(safeOrder);
  } catch { return NextResponse.json({ error: "Order details are temporarily unavailable." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    if (!await requireAdminApi()) throw new HttpError(401, "Please sign in as an admin.");
    const body = await request.json();
    if (!statuses.includes(body?.status)) throw new HttpError(400, "Choose a valid order status.");
    const { id } = await params;
    const updated = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { orderNumber: id }, include: { items: true } });
      if (!order) throw new HttpError(404, "Order not found.");
      const next = body.status as OrderStatus;
      if (order.orderStatus !== "CANCELLED" && next === "CANCELLED") {
        for (const item of order.items) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      } else if (order.orderStatus === "CANCELLED" && next !== "CANCELLED") {
        for (const item of order.items) {
          const result = await tx.productVariant.updateMany({ where: { id: item.variantId, available: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (result.count !== 1) throw new HttpError(409, `${item.productName} does not have enough available stock to reopen this order.`);
        }
      }
      return tx.order.update({ where: { id: order.id }, data: { orderStatus: next }, select: { orderNumber: true, orderStatus: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(updated);
  } catch (error) { return errorResponse(error); }
}
