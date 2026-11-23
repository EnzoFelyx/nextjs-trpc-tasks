import type { Metadata } from "next";
import { Providers } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Simple task manager built with Next.js and tRPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
