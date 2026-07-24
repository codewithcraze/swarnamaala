import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: { type: String, required: true, default: "Custom Photo Magnet" },
    quantity: { type: Number, required: true, min: 1 },
    unitLabel: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
        message: "At least one image is required.",
      },
    },
    note: { type: String, trim: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order = models.Order || model("Order", OrderSchema);
