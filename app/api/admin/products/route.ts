import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, stringField } from "@/lib/http";

export const dynamic = "force-dynamic";
function isValidImageReference(image: string) {
  if (/^\/assets\/[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });
  try { return NextResponse.json(await prisma.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { variants: { orderBy: { price: "asc" } } } })); }
  catch { return NextResponse.json({ error: "Products are temporarily unavailable." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    if (!await requireAdminApi()) throw new HttpError(401, "Please sign in as an admin.");
    const body = await request.json();
    if (!Array.isArray(body?.products) || body.products.length > 250) throw new HttpError(400, "Product updates are invalid.");
    await prisma.$transaction(async tx => {
      for (const item of body.products) {
        if (typeof item?.id !== "string" || typeof item.featured !== "boolean" || typeof item.active !== "boolean" || !Array.isArray(item.variants)) throw new HttpError(400, "Product update is invalid.");
        const image = stringField(item.image, "Product image", 2048);
        if (!isValidImageReference(image)) throw new HttpError(400, "Use an HTTPS image URL or an existing /assets/... image path.");
        for (const variant of item.variants) {
          if (typeof variant.id !== "string" || (variant.size !== "3.5 ml" && variant.size !== "6 ml") || !Number.isInteger(variant.price) || variant.price < 0 || variant.price > 1000000 || !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 1000000 || typeof variant.available !== "boolean") throw new HttpError(400, "Product size, price, stock, or availability is invalid.");
          const changed = await tx.productVariant.updateMany({ where: { id: variant.id, productId: item.id, size: variant.size }, data: { price: variant.price, stock: variant.stock, available: variant.available } });
          if (changed.count !== 1) throw new HttpError(400, "A product size could not be updated.");
        }
        const variants = await tx.productVariant.findMany({ where: { productId: item.id }, select: { available: true, stock: true } });
        await tx.product.update({ where: { id: item.id }, data: { image, featured: item.featured, active: item.active, available: variants.some(v => v.available && v.stock > 0) } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!await requireAdminApi()) throw new HttpError(401, "Please sign in as an admin.");
    const body = await request.json();
    const name = stringField(body?.name, "Product name", 120);
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!id || id.length > 100) throw new HttpError(400, "Use an English product name so it can have a safe product ID.");
    const image = stringField(body?.image, "Product image", 2048);
    if (!isValidImageReference(image)) throw new HttpError(400, "Use an uploaded HTTPS image URL or an existing /assets/... image path.");
    await prisma.product.create({ data: { id, name, brand: "Ease", image, available: false, active: true, featured: false, variants: { create: [{ size: "3.5 ml", price: 130 }, { size: "6 ml", price: 250 }] } } });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
