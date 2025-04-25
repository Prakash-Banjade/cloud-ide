import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Qubide – Your IDE in the Cloud | Code & Deploy Instantly",
    template: "%s • Qubide",
  },
  description: "Qubide is a zero-setup cloud IDE that lets you code, build, and deploy from anywhere in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
          />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
