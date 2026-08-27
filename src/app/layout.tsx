import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swarnamaala.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "swarnamaala.in | Custom Photo Magnets Online in India",
    template: "%s | swarnamaala.in",
  },
  description:
    "Create premium personalised custom photo magnets online. Upload your favourite pictures, choose a pack of 1, 3, 6 or 10 magnets from just \u20B999, and get them delivered across India.",
  keywords: [
    "custom magnets",
    "custom photo magnets",
    "personalised magnets India",
    "picture magnets online",
    "photo magnets",
    "custom magnets Noida Delhi Gurugram",
    "swarnamaala",
  ],
  authors: [{ name: "swarnamaala.in" }],
  creator: "swarnamaala.in",
  alternates: {
    canonical: "/",
  },
  // Favicon configuration — Next.js serves these from /app/icon.svg and
  // /public/favicon.ico automatically; the icons array below adds explicit
  // <link> tags so older browsers and crawlers also pick them up.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "swarnamaala.in",
    title: "Custom Photo Magnets Online in India | swarnamaala.in",
    description:
      "Turn your memories into premium custom photo magnets. Packs from \u20B999. Upload your photos and we deliver across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Photo Magnets Online | swarnamaala.in",
    description:
      "Turn your memories into premium custom photo magnets. Packs from \u20B999. Delivered across India.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: "#FFF8F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "swarnamaala.in",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Custom photo fridge magnets printed and delivered across India.",
    areaServed: "IN",
  };

  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen overflow-x-hidden">{children}</main>
          <Footer />
          <WhatsAppFAB />
        </AuthProvider>
      </body>
    </html>
  );
}
