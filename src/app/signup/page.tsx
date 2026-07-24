import type { Metadata } from "next";
import { Suspense } from "react";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a swarnamaala.in account to order custom photo magnets.",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
