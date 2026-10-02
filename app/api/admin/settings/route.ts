import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, stringField } from "@/lib/http";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: "Please sign in as an admin." }, { status: 401 });
  try {
    const config = await prisma.storeConfig.findUnique({ where: { id: 1 } });
    return NextResponse.json(config ? { ...config, insideCityDelivery: config.insideCityDelivery ?? 0, outsideCityDelivery: config.outsideCityDelivery ?? 0 } : { id: 1, insideCityLabel: "Inside city", outsideCityLabel: "Outside city", insideCityDelivery: 0, outsideCityDelivery: 0 });
  }
  catch { return NextResponse.json({ error: "Store settings are temporarily unavailable." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    if (!await requireAdminApi()) throw new HttpError(401, "Please sign in as an admin.");
    const body = await request.json();
    const insideCityLabel = stringField(body?.insideCityLabel, "Inside-city label", 60);
    const outsideCityLabel = stringField(body?.outsideCityLabel, "Outside-city label", 60);
    const insideCityDelivery = body?.insideCityDelivery === "" || body?.insideCityDelivery == null ? 0 : Number(body.insideCityDelivery);
    const outsideCityDelivery = body?.outsideCityDelivery === "" || body?.outsideCityDelivery == null ? 0 : Number(body.outsideCityDelivery);
    if (!Number.isInteger(insideCityDelivery) || insideCityDelivery < 0 || insideCityDelivery > 1000000 || !Number.isInteger(outsideCityDelivery) || outsideCityDelivery < 0 || outsideCityDelivery > 1000000) throw new HttpError(400, "Delivery fees must be whole numbers of ৳0 or more.");
    const config = await prisma.storeConfig.upsert({ where: { id: 1 }, create: { id: 1, insideCityLabel, outsideCityLabel, insideCityDelivery, outsideCityDelivery }, update: { insideCityLabel, outsideCityLabel, insideCityDelivery, outsideCityDelivery } });
    return NextResponse.json(config);
  } catch (error) { return errorResponse(error); }
}
