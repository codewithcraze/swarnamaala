import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-800 bg-[#040713]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              swarnamaala<span className="text-blue-400">.in</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Turn your favourite memories into premium custom photo magnets. Upload your
            photos, pick a pack, and we deliver beautifully printed magnets to your door
            across Delhi NCR and all of India.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/products/custom-magnets" className="hover:text-blue-400">
                Custom Magnets
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="hover:text-blue-400">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-blue-400">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/#reviews" className="hover:text-blue-400">
                Reviews
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Account</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/signin" className="hover:text-blue-400">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-blue-400">
                Create account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-blue-400">
                My Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} swarnamaala.in. All rights reserved.</p>
          <p>Made with care in India.</p>
        </div>
      </div>
    </footer>
  );
}
