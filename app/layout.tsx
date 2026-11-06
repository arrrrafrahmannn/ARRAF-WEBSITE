import SiteLink from "@/components/site-link";
import type { Metadata } from "next";
import "./globals.css";
import "./liquid-glass.css";
import "./material-field.css";
import "./typography.css";
import "./menu-light.css";
import LiquidSteel from "@/components/liquid-steel";
import { Header, Footer } from "@/components/studio-shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://nurajannatmitu.github.io/ARRAF-WEBSITE/"),
  title: { default: "ARRAFED — Research, with intention.", template: "%s — ARRAFED" },
  description: "Academic research, empirical analysis and editorial support. An independent studio in Dhaka, working with researchers worldwide.",
  openGraph: { title: "ARRAFED — Research, with intention.", description: "Independent thinking. Rigorous methods. Academic research and empirical data support from Dhaka to the world.", type: "website" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/gothic-display.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </head>
      <body className="antialiased"><SiteLink className="skip-link" href="#main">Skip to content</SiteLink><LiquidSteel /><Header />{children}<Footer /></body>
    </html>
  );
}
