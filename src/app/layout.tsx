import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strava Summary",
  description: "Visual summary of your Strava activities",
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
        <Providers>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
            <footer className="py-8 text-center text-xs text-gray-400 dark:text-zinc-600">
              Created by{" "}
              <a
                href="https://www.instagram.com/rakadimas_s/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 hover:underline dark:text-zinc-500"
              >
                Raka Dimas Saputra
              </a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
