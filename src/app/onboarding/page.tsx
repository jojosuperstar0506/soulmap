"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OnboardingStartPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md text-center"
      >
        <h1 className="font-serif text-4xl font-light tracking-wide text-violet-800">
          SoulMap
        </h1>
        <p className="mt-4 text-lg text-violet-600">
          Your cosmic personality blueprint — powered by ancient wisdom
        </p>
        <p className="mt-2 text-sm text-violet-500">
          MBTI meets BaZi. Discover your elemental essence.
        </p>

        <Link
          href="/onboarding/birth"
          className="mt-12 inline-block rounded-full bg-violet-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-violet-500"
        >
          Begin
        </Link>
      </motion.div>
    </div>
  );
}
