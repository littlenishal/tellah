import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tellah - Figma for AI Evals",
  description: "Behavioral design tool for AI products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
