import { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";

import { MotionProvider } from "../components/motion/MotionProvider";
import { ConvexClientProvider } from "../convex/client";
import { Toaster } from "../components/ui/toaster";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-outfit", // optional but recommended
});

export const metadata: Metadata = {
  title: "iPhone Store",
  description: "Premium iPhone-focused ecommerce store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <MotionProvider>
              {children}
              <Toaster />
            </MotionProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
