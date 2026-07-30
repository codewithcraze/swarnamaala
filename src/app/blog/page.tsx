import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogs } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Custom Magnet Ideas, Gifting & Tips",
  description:
    "Ideas, inspiration and tips for custom photo magnets, personalised gifting and preserving your memories, from the swarnamaala.in team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "swarnamaala.in Blog",
    description: "Ideas and tips for custom photo magnets and personalised gifting.",
    url: "/blog",
    type: "website",
  },
};

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndexPage() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogs>> = [];
  try {
    posts = await getPublishedBlogs();
  } catch {
    posts = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-terracotta">
          The swarnamaala blog
        </span>
        <h1 className="mt-5 text-3xl font-bold text-charcoal sm:text-4xl">
          Ideas, gifting &amp; magnet inspiration
        </h1>
        <p className="mt-3 text-muted">
          Tips and stories to help you turn your favourite memories into beautiful magnets.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-line bg-white p-12 text-center text-muted shadow-sm">
          No posts yet — check back soon!
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 360px"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-4xl">📝</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold text-charcoal group-hover:text-terracotta">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{post.description}</p>
                <p className="mt-4 text-xs text-muted">{formatDate(post.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
