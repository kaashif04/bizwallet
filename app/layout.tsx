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
  // Auto by default: the browser bar follows the phone. (A pinned Light/Dark in Profile
  // > Appearance changes the page, not this bar.)
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
    <html lang="en" className={body.variable} suppressHydrationWarning>
      <head>
        {/* Auto (follows the phone) unless the customer pinned Light or Dark in Profile > Appearance.
            Applied before paint, so there's no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme"),r=document.documentElement;if(t==="dark"||t==="light")r.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
