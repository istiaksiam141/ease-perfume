import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const config = await prisma.storeConfig.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      insideCityLabel: config?.insideCityLabel ?? "Inside city", outsideCityLabel: config?.outsideCityLabel ?? "Outside city",
      insideCityDelivery: config?.insideCityDelivery ?? 0, outsideCityDelivery: config?.outsideCityDelivery ?? 0
    });
  } catch { return NextResponse.json({ error: "Delivery settings are temporarily unavailable." }, { status: 503 }); }
}
