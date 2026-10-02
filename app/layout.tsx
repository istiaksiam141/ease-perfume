import type { Metadata } from "next";
import "./system.css";

export const metadata: Metadata = {
  title: "Ease Perfume — Wear your ease",
  description: "Inspired fragrances from Ease. Choose your size and order with cash on delivery."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
