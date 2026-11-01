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
  themeColor: "#F2EFE9", // light by default, whatever the phone's setting
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
    <html lang="en" className={body.variable} data-theme="light" suppressHydrationWarning>
      <head>
        {/* Light unless a signed-in customer picked Dark or Auto (Profile > Appearance).
            Applied before paint, so there's no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme"),r=document.documentElement;if(t==="dark")r.dataset.theme="dark";else if(t==="auto")delete r.dataset.theme}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
