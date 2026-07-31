import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-[#340d00]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo className="h-14 w-auto" />
          <p className="mt-3 text-sm font-medium text-white">
            Your memories, our magnets. Made with love, made to stick.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white">
            Turn your favourite memories into premium custom photo magnets. Same-day
            delivery in Noida, Delhi &amp; Ghaziabad, and shipping across India.
          </p>
          <p className="mt-4 text-sm text-white">
            <span className="font-semibold">WhatsApp:</span>{" "}
            <a href="https://wa.me/919084248821" className="text-white hover:underline">
              +91 90842 48821
            </a>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-white">
            <li>
              <Link href="/products/custom-magnets" className="hover:text-white">
                Custom Magnets
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-white">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/#reviews" className="hover:text-white">
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white">
                Refer &amp; Earn
              </Link>
            </li>
          </ul>
        </div>

        <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-white">
            <li>
              <Link href="/about" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-white">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Policies</h3>
          <ul className="mt-4 space-y-2 text-sm text-white">
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-white">
                Refund &amp; Cancellation
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-white">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} swarnamaala.in. All rights reserved.</p>
          <p>Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
