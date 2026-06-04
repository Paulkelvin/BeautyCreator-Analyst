import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Content Intelligence Engine",
  description:
    "Discover profitable content opportunities, market gaps, trends, pain points, and strategic recommendations from audience conversations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
