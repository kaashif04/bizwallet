import type { MetadataRoute } from "next";

// "Add to Home Screen" / install: opens like an app, straight to the wallet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BizWallet",
    short_name: "BizWallet",
    description: "Order from your table, pay at the counter, earn points every visit.",
    start_url: "/customer/dashboard",
    display: "standalone",
    background_color: "#fff7f0",
    theme_color: "#f26419",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
