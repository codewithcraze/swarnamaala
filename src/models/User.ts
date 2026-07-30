import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Referral program.
    referralCode: { type: String, unique: true, index: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    walletBalance: { type: Number, default: 0 }, // total referral earnings (INR)
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = models.User || model("User", UserSchema);
