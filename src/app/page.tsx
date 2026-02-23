"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSoulmapStore, selectHasCompletedOnboarding } from "@/store/useSoulmapStore";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const hasCompletedOnboarding = useSoulmapStore(selectHasCompletedOnboarding);

  useEffect(() => {
    if (hasCompletedOnboarding) {
      router.replace("/app/blueprint");
    } else {
      router.replace("/onboarding");
    }
  }, [hasCompletedOnboarding, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="font-serif text-4xl font-light text-violet-800">
          SoulMap
        </h1>
        <p className="mt-2 text-violet-500">Calculating your path...</p>
      </motion.div>
    </div>
  );
}
