import type { Metadata } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "考研完形填空 (Cloze Test)",
  description: "考研完形填空练习，根据单词生成填空文章。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={merriweather.variable}>
      <body className="antialiased min-h-screen bg-white text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
