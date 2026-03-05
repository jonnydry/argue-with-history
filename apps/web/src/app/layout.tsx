import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argue With History",
  description: "Debate historical philosophers using their actual writings. AI-powered debate simulator.",
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
