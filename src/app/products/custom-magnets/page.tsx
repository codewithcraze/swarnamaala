import type { Metadata } from "next";
import { Suspense } from "react";
import ProductConfigurator from "./ProductConfigurator";

export const metadata: Metadata = {
  title: "Custom Photo Magnets \u2013 Upload & Order Online",
  description:
    "Design your own custom photo magnets. Upload your pictures, choose a pack of 6, 12 or 18 magnets from \u20B9299 (up to 50), and get them delivered anywhere in India.",
  alternates: { canonical: "/products/custom-magnets" },
  openGraph: {
    title: "Custom Photo Magnets \u2013 swarnamaala.in",
    description:
      "Upload your photos and create premium custom magnets. Packs from \u20B9299, delivered across India.",
    url: "/products/custom-magnets",
  },
};

export default function CustomMagnetsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted">Loading...</div>}>
      <ProductConfigurator />
      
    </Suspense>
  );
}
