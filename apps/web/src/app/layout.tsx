import type { Metadata } from "next";
import "./globals.css";
import { UnifrakturMaguntia } from "next/font/google";

const unifraktur = UnifrakturMaguntia({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-unifraktur",
  display: "swap",
});

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
      <body className={`antialiased ${unifraktur.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-foreground"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
