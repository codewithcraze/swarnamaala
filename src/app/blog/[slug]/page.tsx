import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://swarnamaala.in";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);
  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.description;
  const keywords = post.metaKeywords
    ? post.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      publishedTime: post.createdAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.description,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.createdAt || undefined,
    dateModified: post.updatedAt || undefined,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "swarnamaala.in",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <nav className="mb-6 text-sm text-muted">
        <Link href="/blog" className="hover:text-terracotta">
          Blog
        </Link>{" "}
        / <span className="text-charcoal">{post.title}</span>
      </nav>

      <h1 className="text-3xl font-bold leading-tight text-charcoal sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted">
        By {post.author} · {formatDate(post.createdAt)}
      </p>

      {post.coverImage && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-cream">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {post.description && (
        <p className="mt-6 text-lg leading-relaxed text-muted">{post.description}</p>
      )}

      {/* Content is authored by admins via the CRM editor (trusted HTML). */}
      <div
        className="prose mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="mt-12 rounded-2xl border border-line bg-[#fdf1e6] p-6 text-center">
        <h2 className="text-lg font-semibold text-charcoal">Turn your memories into magnets</h2>
        <p className="mt-1 text-sm text-muted">Premium custom photo magnets, delivered across India.</p>
        <Link
          href="/products/custom-magnets"
          className="mt-4 inline-block rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark"
        >
          Create your magnets
        </Link>
      </div>
    </article>
  );
}
