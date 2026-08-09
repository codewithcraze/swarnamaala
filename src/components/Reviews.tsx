import { REVIEWS, AVERAGE_RATING, type Review } from "@/lib/reviews";
import Image from "next/image";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className={i < rating ? "text-gold" : "text-line"}
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark text-sm font-semibold text-white">
          {initials(review.name)}
        </div>
        <div className="min-w-0">
          <figcaption className="truncate font-medium text-charcoal">
            {review.name}
          </figcaption>
          <p className="flex items-center gap-1 text-xs text-terracotta">
            <PinIcon />
            {review.location}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Stars rating={review.rating} />
      </div>
      <div style={{borderRadius: "1rem"}}>
        {review.image && <Image src={review.image} alt="review Image" width={300} height={100} style={{height: "150px", width: "100%", borderRadius: '1rem'}} />}
      </div>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        &ldquo;{review.text}&rdquo;
      </blockquote>
    </figure>
  );
}

export default function Reviews() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-terracotta">
          Customer reviews
        </span>
        <h2 className="mt-5 text-3xl font-bold text-charcoal sm:text-4xl">
          Loved across Delhi NCR
        </h2>
        <p className="mt-3 flex items-center justify-center gap-2 text-muted">
          <Stars rating={Math.round(AVERAGE_RATING)} />
          <span className="font-semibold text-charcoal">{AVERAGE_RATING}</span>
          <span>from happy customers in Noida, Delhi &amp; Gurugram</span>
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((review) => (
          <ReviewCard key={review.name} review={review} />
        ))}
      </div>
    </section>
  );
}
