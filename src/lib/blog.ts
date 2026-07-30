import { connectToDatabase } from "@/lib/mongodb";
import { Blog } from "@/models/Blog";

export type BlogListItem = {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  createdAt: string;
};

export type BlogFull = BlogListItem & {
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  updatedAt: string;
};

type RawBlog = {
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getPublishedBlogs(): Promise<BlogListItem[]> {
  await connectToDatabase();
  const blogs = await Blog.find({ published: true })
    .sort({ createdAt: -1 })
    .select("slug title description coverImage author createdAt")
    .lean<RawBlog[]>();
  return blogs.map((b) => ({
    slug: b.slug ?? "",
    title: b.title ?? "",
    description: b.description ?? "",
    coverImage: b.coverImage ?? "",
    author: b.author ?? "swarnamaala.in",
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : "",
  }));
}

export async function getBlogBySlug(slug: string): Promise<BlogFull | null> {
  await connectToDatabase();
  const b = await Blog.findOne({ slug, published: true }).lean<RawBlog | null>();
  if (!b) return null;
  return {
    slug: b.slug ?? "",
    title: b.title ?? "",
    description: b.description ?? "",
    content: b.content ?? "",
    coverImage: b.coverImage ?? "",
    author: b.author ?? "swarnamaala.in",
    metaTitle: b.metaTitle ?? "",
    metaDescription: b.metaDescription ?? "",
    metaKeywords: b.metaKeywords ?? "",
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : "",
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : "",
  };
}
