import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const body = Nunito({ subsets: ["latin"], variable: "--font-body" });
const display = Fredoka({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "BizWallet", template: "%s · BizWallet" },
  description: "Order from your table, pay at the counter, earn points every visit.",
};

export const viewport: Viewport = {
  themeColor: "#fff7f0",
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
