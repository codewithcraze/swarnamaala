import type { MetadataRoute } from "next";
import { getPublishedBlogs } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swarnamaala.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths: {
    path: string;
    priority: number;
    freq: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1, freq: "weekly" },
    { path: "/products/custom-magnets", priority: 0.9, freq: "weekly" },
    { path: "/blog", priority: 0.7, freq: "weekly" },
    { path: "/about", priority: 0.5, freq: "monthly" },
    { path: "/contact", priority: 0.5, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/refund-policy", priority: 0.3, freq: "yearly" },
    { path: "/shipping-policy", priority: 0.3, freq: "yearly" },
    { path: "/signin", priority: 0.3, freq: "yearly" },
    { path: "/signup", priority: 0.3, freq: "yearly" },
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  try {
    const posts = await getPublishedBlogs();
    for (const post of posts) {
      entries.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.createdAt ? new Date(post.createdAt) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    /* DB unavailable at build — static paths still returned */
  }

  return entries;
}
