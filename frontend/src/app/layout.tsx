import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KindCrew",
  description: "Full-stack Next.js and Express application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
