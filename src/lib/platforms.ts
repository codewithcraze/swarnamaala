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

// Platforms whose own order ID the customer types in. For these we only ask
// the name: no email/phone and no account. The admin creates a login from the
// CRM if needed. Every other platform gets an auto-generated order ID and the
// customer gives their email.
export const ORDER_ID_PLATFORMS: readonly string[] = ["meesho", "flipkart", "amazon"];
export function usesPlatformOrderId(id: string | undefined | null) {
  return ORDER_ID_PLATFORMS.includes(String(id));
}

export function platformLabel(id: string | undefined | null) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? (id ? id : "Website");
}
export function isPlatform(id: unknown): id is PlatformId {
  return PLATFORMS.some((p) => p.id === id);
}
