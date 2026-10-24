// Selling platforms for marketplace orders. Safe to import in the browser.
export const PLATFORMS = [
  { id: "meesho", label: "Meesho" },
  { id: "flipkart", label: "Flipkart" },
  { id: "amazon", label: "Amazon" },
  { id: "myntra", label: "Myntra" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "other", label: "Other" },
] as const;
export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const MAX_MARKETPLACE_QTY = 50;

export function platformLabel(id: string | undefined | null) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? (id ? id : "Website");
}
export function isPlatform(id: unknown): id is PlatformId {
  return PLATFORMS.some((p) => p.id === id);
}
