import { User } from "@/models/User";

// Human-friendly, unambiguous alphabet (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 7): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Generates a referral code that isn't already taken.
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const exists = await User.findOne({ referralCode: code }).lean();
    if (!exists) return code;
  }
  // Extremely unlikely fallback.
  return `${randomCode()}${Date.now().toString(36).toUpperCase().slice(-3)}`;
}
