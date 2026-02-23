"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectUserProfile } from "@/store/useSoulmapStore";

const STEPS = [
  "Calculating your Four Pillars...",
  "Analyzing your Five Elements balance...",
  "Assembling your Soul Blueprint...",
];

export default function GeneratingPage() {
  const router = useRouter();
  const userProfile = useSoulmapStore(useShallow(selectUserProfile));
  const setBaziChart = useSoulmapStore((s) => s.setBaziChart);
  const completeOnboarding = useSoulmapStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) {
      router.replace("/onboarding/birth");
      return;
    }

    const runCalculation = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        setStep(i);
        await new Promise((r) => setTimeout(r, 1200));
      }

      try {
        const res = await fetch("/api/bazi/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: userProfile.birthDate,
            birthTime: userProfile.birthTime,
            gender: userProfile.gender,
          }),
        });
        if (!res.ok) throw new Error("Calculation failed");
        const chart = await res.json();
        setBaziChart(chart);
        completeOnboarding();
        router.replace("/app/blueprint");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    };

    runCalculation();
  }, [
    userProfile,
    setBaziChart,
    completeOnboarding,
    router,
  ]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/onboarding/birth")}
          className="mt-4 text-violet-600 hover:underline"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: step >= i ? 1.2 : 1,
                opacity: step >= i ? 1 : 0.3,
              }}
              className="h-2 w-2 rounded-full bg-violet-500"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-lg text-violet-700"
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-2 border-violet-400 border-t-violet-300"
        />
      </motion.div>
    </div>
  );
}
