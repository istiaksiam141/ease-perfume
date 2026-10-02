import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse, normalizeBangladeshPhone, stringField } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = stringField(body?.orderNumber, "Order number", 40).toUpperCase();
    const phone = normalizeBangladeshPhone(body?.phone);
    const order = await prisma.order.findFirst({ where: { orderNumber, phone }, select: { orderNumber: true, orderStatus: true, createdAt: true, items: { select: { productName: true, size: true, quantity: true } } } });
    if (!order) throw new HttpError(404, "We couldn't find an order matching that order number and phone number.");
    return NextResponse.json(order);
  } catch (error) { return errorResponse(error); }
}
