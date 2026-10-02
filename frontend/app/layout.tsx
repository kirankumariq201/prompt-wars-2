import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA PLUS — Marketplace Reliability Control Plane",
  description: "Operational reliability control for NOVA CART",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
