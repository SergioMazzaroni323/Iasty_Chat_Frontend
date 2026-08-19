import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iasty",
  description: "Iasty AI chatbot",
  icons: {
    icon: [{ url: "/branding/iasty-icon.png", type: "image/png" }],
    shortcut: [{ url: "/branding/iasty-icon.png", type: "image/png" }],
    apple: [{ url: "/branding/iasty-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
