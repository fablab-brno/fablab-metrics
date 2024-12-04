import { Header } from "fablab-metrics/components/Header";
import { DateRangeProvider } from "fablab-metrics/ui/useDateRange";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fablab Brno - Metriky",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DateRangeProvider>
          <main className="pt-20">{children}</main>
          <Header />
        </DateRangeProvider>
      </body>
    </html>
  );
}
