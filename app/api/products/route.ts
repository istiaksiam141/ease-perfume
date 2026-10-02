import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: { orderBy: { price: "asc" } } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "The collection is temporarily unavailable." },
      { status: 503 }
    );
  }
}