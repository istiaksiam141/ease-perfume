import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { assertSameOrigin, requireAdminApi } from "@/lib/auth";
import { errorResponse, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function matchesFileType(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).join(",") === "137,80,78,71,13,10,26,10";
  if (type === "image/webp") return String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!await requireAdminApi()) throw new HttpError(401, "Please sign in as an admin.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, "Image uploads are not configured yet. Ask the site owner to connect Vercel Blob.");

    let form: FormData;
    try { form = await request.formData(); }
    catch { throw new HttpError(400, "Choose a product image to upload."); }
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) throw new HttpError(400, "Choose a product image to upload.");
    if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, "Product images must be 4 MB or smaller.");
    const extension = IMAGE_TYPES.get(file.type);
    if (!extension) throw new HttpError(415, "Use a JPEG, PNG, or WebP image.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesFileType(file.type, bytes)) throw new HttpError(415, "The selected file does not match its image type.");

    const safeBase = file.name.replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "perfume";
    const blob = await put(`products/${safeBase}.${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    if (error instanceof HttpError) return errorResponse(error);
    console.error("Product image upload failed.");
    return NextResponse.json({ error: "The image upload failed. Please try again." }, { status: 502 });
  }
}
