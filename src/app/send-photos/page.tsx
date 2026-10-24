import type { Metadata } from "next";
import SendPhotosClient from "./SendPhotosClient";

export const metadata: Metadata = {
  title: "Send photos for your marketplace order",
  description: "Bought custom magnets on Meesho, Flipkart or Amazon? Upload your photos here — no sign-up needed.",
  alternates: { canonical: "/send-photos" },
  // Shared privately with customers; keep it out of search results.
  robots: { index: false, follow: false },
};

export default function SendPhotosPage() {
  return <SendPhotosClient />;
}
