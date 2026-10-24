import Link from "next/link";
import Image from "next/image";

/**
 * Full brand lockup from /public/logo.png (mark + wordmark + tagline).
 * Size is controlled via the `className` height utility (width stays auto so
 * the aspect ratio is preserved).
 */
export default function Logo({
  href = "/",
  onClick,
  className = "h-16 w-auto sm:h-14",
  priority = false,
}: {
  href?: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center overflow-hidden rounded-xl bg-[#fbf6ef] shadow-sm ring-1 ring-terracotta/50"
      aria-label="swarnamaala.in home"
    >
      {/* The logo artwork has an ivory background, so it sits on an ivory
          plate with a gold ring — reads as a deliberate badge on the dark theme.
          object-cover trims the artwork's empty top/bottom margin. */}
      <Image
        src="/logo.png"
        alt="swarnamaala.in — Custom Photo Magnets"
        width={520}
        height={260}
        priority={priority}
        className={`${className} object-cover`}
        style={{ height: "60px", width: "190px" }}
      />
    </Link>
  );
}
