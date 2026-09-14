import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const barlow = localFont({
  src: [
    { path: "./fonts/barlow/Barlow-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/barlow/Barlow-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/barlow/Barlow-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/barlow/Barlow-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/barlow/Barlow-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = localFont({
  src: [
    { path: "./fonts/barlow-condensed/BarlowCondensed-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/barlow-condensed/BarlowCondensed-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/barlow-condensed/BarlowCondensed-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "365 Fitness Grenada",
    template: "%s | 365 Fitness",
  },
  description: "Personal training, strength training, nutrition guidance, at-home programs, hybrid coaching, and online coaching from 365 Fitness Grenada.",
  keywords: [
    "365 Fitness",
    "365 Fitness Grenada",
    "personal training Grenada",
    "fitness coaching Grenada",
    "strength training Grenada",
    "online coaching",
    "at-home fitness coaching",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
