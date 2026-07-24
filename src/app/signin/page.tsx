import type { Metadata } from "next";
import { Suspense } from "react";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your swarnamaala.in account to order custom photo magnets.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
