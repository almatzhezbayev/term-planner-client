import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Term Planner",
  description: "Transcript parser and requirement planner",
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
