import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const CouponSchema = new Schema(
  {
    // Stored uppercase; lookups uppercase the incoming code.
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // "percent" -> value is a percentage (e.g. 10 = 10% off)
    // "flat"    -> value is a rupee amount off (e.g. 50 = ₹50 off)
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },

    // Only for percent coupons: cap the rupee discount (0 = no cap).
    maxDiscount: { type: Number, default: 0, min: 0 },
    // Minimum order subtotal (pre-GST) required to use the coupon.
    minOrderValue: { type: Number, default: 0, min: 0 },

    // 0 = unlimited uses. Otherwise coupon is dead once usedCount >= usageLimit.
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },

    active: { type: Boolean, default: true, index: true },
    // null = never expires.
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type CouponDoc = InferSchemaType<typeof CouponSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Coupon = models.Coupon || model("Coupon", CouponSchema);
