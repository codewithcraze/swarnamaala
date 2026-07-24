import type { Metadata } from "next";
import { Suspense } from "react";
import ProductConfigurator from "./ProductConfigurator";

export const metadata: Metadata = {
  title: "Custom Photo Fridge Magnets \u2013 Upload & Order Online",
  description:
    "Design your own photo fridge magnets. Upload a picture, choose a pack of 1, 3, 6 or 10 magnets from \u20B999, and get them delivered anywhere in India.",
  alternates: { canonical: "/products/fridge-magnets" },
  openGraph: {
    title: "Custom Photo Fridge Magnets \u2013 swarnamaala.in",
    description:
      "Upload your photo and create premium custom fridge magnets. Packs from \u20B999, delivered across India.",
    url: "/products/fridge-magnets",
  },
};

export default function FridgeMagnetsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Loading...</div>}>
      <ProductConfigurator />
    </Suspense>
  );
}
