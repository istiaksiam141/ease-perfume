import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, errorResponse, stringField } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderNumber = stringField(body?.orderNumber, "Order number", 40);
    const receiptToken = stringField(body?.receiptToken, "Receipt token", 80);
    const order = await prisma.order.findFirst({ where: { orderNumber, receiptToken }, include: { items: { select: { productName: true, productImage: true, size: true, quantity: true, unitPrice: true, totalPrice: true } } } });
    if (!order) throw new HttpError(404, "We couldn't find that order receipt. Please return to the confirmation page or track your order with your phone number.");
    return NextResponse.json({ orderNumber: order.orderNumber, customerName: order.customerName, address: order.address, area: order.area, city: order.city, total: order.total, subtotal: order.subtotal, deliveryCharge: order.deliveryCharge, paymentMethod: order.paymentMethod, orderStatus: order.orderStatus, createdAt: order.createdAt, items: order.items });
  } catch (error) { return errorResponse(error); }
}
