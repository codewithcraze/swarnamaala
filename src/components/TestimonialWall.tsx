import { REVIEWS, AVERAGE_RATING, type Review } from "@/lib/reviews";

// A full-height "wall of love": three columns of review cards gently scrolling
// in alternating directions. Pure CSS animation (see globals.css) so it works
// without client JS. Hovering a column pauses it for comfortable reading.

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
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

function TestimonialCard({ review }: { review: Review }) {
  return (
    <figure className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark text-xs font-semibold text-white">
            {initials(review.name)}
          </div>
          <div className="min-w-0">
            <figcaption className="truncate text-sm font-semibold text-charcoal">
              {review.name}
            </figcaption>
            <p className="truncate text-xs text-muted">{review.location}</p>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <blockquote className="mt-3 text-sm leading-relaxed text-muted">
        &ldquo;{review.text}&rdquo;
      </blockquote>
    </figure>
  );
}

// Split reviews round-robin into N columns so each column is well-balanced.
function toColumns(reviews: Review[], n: number): Review[][] {
  const cols: Review[][] = Array.from({ length: n }, () => []);
  reviews.forEach((r, i) => cols[i % n].push(r));
  return cols;
}

function Column({
  reviews,
  direction,
  duration,
}: {
  reviews: Review[];
  direction: "up" | "down";
  duration: string;
}) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...reviews, ...reviews];
  return (
    <div className="marquee-col relative overflow-hidden">
      <div
        className={`marquee-track ${direction === "up" ? "marquee-up" : "marquee-down"}`}
        style={{ "--marquee-duration": duration } as React.CSSProperties}
      >
        {loop.map((r, i) => (
          <TestimonialCard key={`${r.name}-${i}`} review={r} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialWall() {
  const [c1, c2, c3] = toColumns(REVIEWS, 3);

  return (
    <section className="relative overflow-hidden bg-cream py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT: the impact statement */}
        <div className="lg:pr-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-terracotta">
            A wall of love
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
            10,000+ magnets
            <span className="block text-terracotta">on fridges across India</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Every magnet is a memory someone chose to keep in sight. Here&apos;s what
            families, couples and gift-givers say after their photos arrive.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { stat: "10k+", label: "Magnets delivered" },
              { stat: `${AVERAGE_RATING}\u2605`, label: "Average rating" },
              { stat: "2,000+", label: "Happy customers" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-terracotta sm:text-3xl">{s.stat}</p>
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: the scrolling columns, capped to one viewport height */}
        <div className="relative h-[70vh] max-h-[640px] min-h-[460px]">
          {/* top & bottom fade masks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-cream to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-cream to-transparent" />

          <div className="grid h-full grid-cols-2 gap-4 sm:grid-cols-3">
            <Column reviews={c1} direction="up" duration="36s" />
            <Column reviews={c2} direction="down" duration="46s" />
            {/* third column hidden on the smallest screens to avoid cramping */}
            <div className="hidden sm:block">
              <Column reviews={c3} direction="up" duration="52s" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
