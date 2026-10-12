import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/MotionProvider";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "BizWallet", template: "%s · BizWallet" },
  appleWebApp: { capable: true, title: "BizWallet", statusBarStyle: "default" },
  description: "Order from your table, pay at the counter, earn points every visit.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EFE9" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
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
    <html lang="en" className={body.variable}>
      <body className="font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
