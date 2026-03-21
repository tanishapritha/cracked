import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "crackeddev",
  description: "Socratic coding coach for FAANG interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
    >
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
