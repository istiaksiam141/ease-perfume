import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Request failed", error);
  return NextResponse.json({ error: "We couldn't complete that request. Please try again." }, { status: 500 });
}
export function stringField(value: unknown, label: string, max = 300) {
  if (typeof value !== "string") throw new HttpError(400, `${label} is required.`);
  const clean = value.trim();
  if (!clean || clean.length > max) throw new HttpError(400, `${label} is required (maximum ${max} characters).`);
  return clean;
}
export function normalizeBangladeshPhone(value: unknown) {
  if (typeof value !== "string") throw new HttpError(400, "Enter a valid Bangladesh phone number.");
  const digits = value.replace(/[\s()-]/g, "");
  const canonical = digits.startsWith("+880") ? `0${digits.slice(4)}` : digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
  if (!/^01[3-9]\d{8}$/.test(canonical)) throw new HttpError(400, "Enter a valid Bangladesh phone number, such as 01XXXXXXXXX.");
  return canonical;
}
