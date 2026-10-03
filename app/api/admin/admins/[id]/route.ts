import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdminApi();
    if (!actor) throw new HttpError(401, "Please sign in as an admin.");
    if (!actor.isMainAdmin) throw new HttpError(403, "Only the main admin can manage admin accounts.");

    const { id } = await params;
    if (id === actor.id) throw new HttpError(400, "You cannot remove your own admin account.");

    const result = await prisma.admin.deleteMany({ where: { id, isMainAdmin: false } });
    if (result.count === 0) throw new HttpError(404, "That administrator was not found or cannot be removed.");
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
