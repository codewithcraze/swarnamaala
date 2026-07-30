import type { Metadata } from "next";
import { Suspense } from "react";
import ProductConfigurator from "./ProductConfigurator";

export const metadata: Metadata = {
  title: "Custom Photo Magnets \u2013 Upload & Order Online",
  description:
    "Design your own custom photo magnets. Upload a picture, choose a pack of 1, 3, 6 or 10 magnets from \u20B999, and get them delivered anywhere in India.",
  alternates: { canonical: "/products/custom-magnets" },
  openGraph: {
    title: "Custom Photo Magnets \u2013 swarnamaala.in",
    description:
      "Upload your photo and create premium custom magnets. Packs from \u20B999, delivered across India.",
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
