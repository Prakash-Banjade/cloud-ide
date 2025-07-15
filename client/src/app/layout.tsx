import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/session-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: "400" });

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ibmPlexSans.className} antialiased h-screen`}
      >
        <ScrollArea className="h-screen overflow-y-auto">
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster
                position="bottom-right"
                reverseOrder={false}
              />
              <AuthProvider>
                {children}
              </AuthProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ScrollArea>
      </body>
    </html>
  );
}
