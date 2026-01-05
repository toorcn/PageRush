import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: "PageRush AI - Smart Study Tools",
  description: "Transform your study materials into interactive learning tools with AI-powered flashcards, quizzes, study guides, and more.",
  keywords: ["study tools", "AI learning", "flashcards", "quiz generator", "study guide", "exam prep"],
  authors: [{ name: "PageRush AI" }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PageRush AI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "PageRush AI - Smart Study Tools",
    description: "Transform your study materials into interactive learning tools with AI-powered flashcards, quizzes, study guides, and more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PageRush AI - Smart Study Tools",
    description: "Transform your study materials into interactive learning tools with AI-powered flashcards, quizzes, study guides, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PageRush AI" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
