import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ParKit | Smart Urban Parking Made Effortless",
  description: "Find guaranteed parking spots in seconds or monetize your driveway with ParKit.",
  keywords: ["parking", "find parking", "rent parking space", "driveway rental", "smart parking"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} font-sans h-full antialiased overflow-x-hidden`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#2FD08A] selection:text-[#0B1F3A] overflow-x-hidden max-w-full">
        {children}
      </body>
    </html>
  );
}
