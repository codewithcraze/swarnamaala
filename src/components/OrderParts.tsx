import { STATE_LABEL, timeline, type OrderLike, type ViewState } from "@/lib/orderView";

// Small presentational pieces shared by the order list and order detail page.

const TONE: Record<string, string> = {
  warn: "text-amber-700 dark:text-amber-300 bg-amber-400/10",
  bad: "text-red-600 dark:text-red-400 bg-red-500/10",
  ok: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
  muted: "text-muted bg-line/60",
};

export function StatePill({ state }: { state: ViewState }) {
  const l = STATE_LABEL[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[12.5px] font-semibold ${TONE[l.tone]}`}>
      <span className="h-[7px] w-[7px] rounded-full bg-current" />
      {l.text}
    </span>
  );
}

// Horizontal progress: dots joined by lines, gold when done.
export function OrderTimeline({ order, compact = false }: { order: OrderLike; compact?: boolean }) {
  const steps = timeline(order);
  return (
    <ol className="m-0 grid list-none grid-cols-5 p-0" aria-label="Order progress">
      {steps.map((s, i) => {
        const done = s.state === "done";
        const line = i > 0 ? (steps[i].state === "done" ? "bg-terracotta" : "bg-line") : "";
        return (
          <li
            key={s.label}
            className={`relative text-center ${compact ? "text-[10.5px] sm:text-[12px]" : "text-[11px] sm:text-[13px]"} ${
              done ? "text-charcoal" : s.state === "cur" ? "font-semibold text-amber-700 dark:text-amber-300" : s.state === "bad" ? "font-semibold text-red-600 dark:text-red-400" : "text-muted"
            }`}
          >
            {i > 0 && <span className={`absolute left-[calc(-50%+8px)] top-[6px] h-0.5 w-[calc(100%-16px)] ${line}`} />}
            <span
              className={`relative z-[1] mx-auto mb-1.5 block h-3.5 w-3.5 rounded-full border-2 ${
                done
                  ? "border-terracotta bg-terracotta"
                  : s.state === "cur"
                    ? "border-amber-600 dark:border-amber-300 bg-surface shadow-[0_0_0_4px_rgba(252,211,77,0.18)]"
                    : s.state === "bad"
                      ? "border-red-500 dark:border-red-400 bg-surface shadow-[0_0_0_4px_rgba(248,113,113,0.18)]"
                      : "border-line bg-surface"
              }`}
            />
            <span className="block leading-tight">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Stacked photo thumbnails with a "+N" chip.
export function OrderThumbs({ images, max = 3 }: { images: string[]; max?: number }) {
  const shown = images.slice(0, max);
  const extra = images.length - shown.length;
  if (images.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={images[0]} alt="" loading="lazy" className="h-[88px] w-[88px] rounded-2xl bg-black object-cover" />
    );
  }
  return (
    <div className="flex pl-3">
      {shown.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={src} alt="" loading="lazy" className="-ml-3 h-[68px] w-[68px] rounded-[14px] border-2 border-surface bg-black object-cover" />
      ))}
      {extra > 0 && (
        <span className="-ml-3 grid h-[68px] w-[68px] place-items-center rounded-[14px] border-2 border-surface bg-cream text-sm font-semibold text-muted">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function formatDate(d: string | Date, withTime = false) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
