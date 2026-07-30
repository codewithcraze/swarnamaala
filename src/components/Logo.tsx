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
    <Link href={href} onClick={onClick} className="flex items-center" aria-label="swarnamaala.in home">
      <Image
        src="/logo.png"
        alt="swarnamaala.in — Custom Photo Magnets"
        width={520}
        height={300}
        priority={priority}
        className={className}
      />
    </Link>
  );
}
