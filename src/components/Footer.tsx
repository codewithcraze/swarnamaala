import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-[#fdf1e6]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo className="h-14 w-auto" />
          <p className="mt-3 text-sm font-medium text-terracotta">
            Your memories, our magnets. Made with love, made to stick.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Turn your favourite memories into premium custom photo magnets. Same-day
            delivery in Noida, Delhi &amp; Ghaziabad, and shipping across India.
          </p>
          <p className="mt-4 text-sm text-charcoal">
            <span className="font-semibold">WhatsApp:</span>{" "}
            <a href="https://wa.me/919084248821" className="text-terracotta hover:underline">
              +91 90842 48821
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-charcoal">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/products/custom-magnets" className="hover:text-terracotta">
                Custom Magnets
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-terracotta">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-terracotta">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/#reviews" className="hover:text-terracotta">
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-terracotta">
                Refer &amp; Earn
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-charcoal">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-terracotta">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-terracotta">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-terracotta">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-charcoal">Policies</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/terms" className="hover:text-terracotta">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-terracotta">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-terracotta">
                Refund &amp; Cancellation
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-terracotta">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} swarnamaala.in. All rights reserved.</p>
          <p>Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
