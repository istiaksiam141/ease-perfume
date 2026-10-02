import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paymentProvider } from "@/lib/payment";
import { assertSameOrigin } from "@/lib/auth";
import { errorResponse, HttpError, normalizeBangladeshPhone, stringField } from "@/lib/http";

export const dynamic = "force-dynamic";
type CartLine = { productId: string; size: string; quantity: number };

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const customer = body?.customer;
    const name = stringField(customer?.name, "Full name", 120);
    const phone = normalizeBangladeshPhone(customer?.phone);
    const address = stringField(customer?.address, "Delivery address", 500);
    const city = stringField(customer?.city, "City", 100);
    const area = stringField(customer?.area, "Area", 100);
    const email = typeof customer?.email === "string" && customer.email.trim() ? customer.email.trim().slice(0, 200) : null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address or leave it blank.");
    const note = typeof customer?.note === "string" ? customer.note.trim().slice(0, 1000) || null : null;
    const zone = body?.deliveryZone;
    if (zone !== "INSIDE_CITY" && zone !== "OUTSIDE_CITY") throw new HttpError(400, "Choose a delivery area.");
    if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 30) throw new HttpError(400, "Your cart is empty or contains too many different items.");

    const quantities = new Map<string, number>();
    for (const raw of body.items as CartLine[]) {
      if (!raw || typeof raw.productId !== "string" || !/^[a-z0-9-]{1,100}$/.test(raw.productId)) throw new HttpError(400, "One of the products in your cart is invalid.");
      if (raw.size !== "3.5 ml" && raw.size !== "6 ml") throw new HttpError(400, "Choose a valid product size.");
      if (!Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 25) throw new HttpError(400, "Product quantities must be between 1 and 25.");
      const key = `${raw.productId}\u0000${raw.size}`;
      quantities.set(key, (quantities.get(key) ?? 0) + raw.quantity);
      if ((quantities.get(key) ?? 0) > 25) throw new HttpError(400, "The quantity for a product cannot exceed 25.");
    }

    const created = await prisma.$transaction(async tx => {
      const config = await tx.storeConfig.findUnique({ where: { id: 1 } });
      const deliveryCharge = zone === "INSIDE_CITY" ? config?.insideCityDelivery : config?.outsideCityDelivery;
      if (deliveryCharge === null || deliveryCharge === undefined) throw new HttpError(503, "Delivery fees are not configured yet. Please contact the store before placing an order.");
      const prepared: Array<{ productId: string; variantId: string; productName: string; productImage: string; size: string; quantity: number; unitPrice: number }> = [];
      let subtotal = 0;
      for (const [key, quantity] of quantities) {
        const [productId, size] = key.split("\u0000");
        const variant = await tx.productVariant.findUnique({ where: { productId_size: { productId, size } }, include: { product: true } });
        if (!variant || !variant.product.active) throw new HttpError(409, "A product in your cart is currently unavailable. Please remove it and try again.");
        if (variant.stock < quantity) throw new HttpError(409, `${variant.product.name} has only ${variant.stock} of the selected size available.`);
        const changed = await tx.productVariant.updateMany({ where: { id: variant.id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
        if (changed.count !== 1) throw new HttpError(409, `${variant.product.name} just sold out in that size. Please review your cart.`);
        const totalPrice = variant.price * quantity;
        subtotal += totalPrice;
        prepared.push({ productId: variant.productId, variantId: variant.id, productName: variant.product.name, productImage: variant.product.image, size, quantity, unitPrice: variant.price });
      }
      // Payment setup is isolated so a gateway can be added without changing
      // server-side pricing, stock validation, or order-item creation.
      const payment = paymentProvider(PaymentMethod.COD).initialize(subtotal + deliveryCharge);
      const order = await tx.order.create({ data: {
          orderNumber: `PENDING-${randomUUID()}`, receiptToken: randomUUID(), customerName: name, phone, email, address, city, area, note,
          deliveryZone: zone, subtotal, deliveryCharge, total: subtotal + deliveryCharge,
          paymentMethod: payment.method, paymentStatus: payment.status, orderStatus: "PENDING",
          items: { create: prepared.map(line => ({ ...line, totalPrice: line.unitPrice * line.quantity })) }
      } });
      const date = order.createdAt.toISOString().slice(0, 10).replaceAll("-", "");
      const orderNumber = `ORD-${date}-${String(order.id).padStart(4, "0")}`;
      return tx.order.update({ where: { id: order.id }, data: { orderNumber }, select: { orderNumber: true, receiptToken: true, total: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ orderNumber: created.orderNumber, receiptToken: created.receiptToken, total: created.total }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return NextResponse.json({ error: "Stock changed while placing your order. Please review your cart and try again." }, { status: 409 });
    return errorResponse(error);
  }
}
