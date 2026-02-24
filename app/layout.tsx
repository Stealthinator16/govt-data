import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SearchDialog } from "@/components/search/search-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://npl.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "National Premier League — Indian State Rankings",
    template: "%s | NPL",
  },
  description:
    "Ranking and comparing Indian states across every measurable dimension of human life. 27 categories, 1000+ metrics, 36 states and UTs.",
  openGraph: {
    type: "website",
    siteName: "National Premier League",
    title: "National Premier League — Indian State Rankings",
    description:
      "Ranking and comparing Indian states across every measurable dimension of human life. 27 categories, 1000+ metrics, 36 states and UTs.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        {children}
        <SearchDialog />
      </body>
    </html>
  );
}
