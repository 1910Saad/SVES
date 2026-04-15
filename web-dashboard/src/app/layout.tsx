import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SVES — Smart Venue Experience System",
  description: "Real-time venue management platform for large-scale sporting events. AI-powered crowd management, intelligent navigation, and seamless coordination.",
  keywords: ["venue management", "crowd management", "smart stadium", "IoT", "real-time analytics"],
  authors: [{ name: "Saad Khan" }],
  openGraph: {
    title: "SVES — Smart Venue Experience System",
    description: "Proactive, AI-driven command center for modern venue operations.",
    url: "https://sves-dashboard-796928583635.us-central1.run.app/",
    siteName: "SVES",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
