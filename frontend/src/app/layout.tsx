"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import { AbstraxionProvider } from "@burnt-labs/abstraxion";
import "@burnt-labs/abstraxion/dist/index.css";
import { PriceProvider } from "@/lib/PriceContext";
import { ToastProvider } from "@/lib/ToastContext";
import { Metadata } from "next";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const treasuryConfig = {
  treasury: "xion1rqk27vf0kv6jfx8wflnhz99s4l8ry2ww4m6jp39um7wn0c8ssj4q967wc4",
  gasPrice: "0.001uxion", 
  rpcUrl: "https://rpc.xion-testnet-2.burnt.com:443",
  restUrl: "https://api.xion-testnet-2.burnt.com:443",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans h-full bg-gray-100 dark:bg-zinc-950`}>
        <AbstraxionProvider config={treasuryConfig}>
          <PriceProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </PriceProvider>
        </AbstraxionProvider>
      </body>
    </html>
  );
}