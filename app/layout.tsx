import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: { default: "BizCafé", template: "%s · BizCafé" },
  description: "Order from your table, pay at the counter, earn points on every cup.",
};

export const viewport: Viewport = {
  themeColor: "#fdf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
