import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "cracked] - Get cracked at coding interviews",
    template: "%s | cracked]",
  },
  description:
    "Socratic coding coach for FAANG interview prep. Stop memorizing solutions. Learn to think like an engineer.",
  keywords: [
    "coding interview",
    "FAANG prep",
    "leetcode",
    "algorithm practice",
    "coding coach",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-[#0a0a0a] text-[#f5f5f5]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
