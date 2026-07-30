import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true },
    content: { type: String }, // HTML produced by the rich text editor
    coverImage: { type: String },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String, trim: true },
    author: { type: String, default: "swarnamaala.in" },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type BlogDoc = InferSchemaType<typeof BlogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Blog = models.Blog || model("Blog", BlogSchema);
