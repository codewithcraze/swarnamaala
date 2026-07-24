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
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = models.User || model("User", UserSchema);
