"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSoulmapStore } from "@/store/useSoulmapStore";
import type { Shichen } from "@/types/bazi";

const SHICHEN_OPTIONS: { value: Shichen; label: string; range: string }[] = [
  { value: "子时", label: "子时", range: "23:00–01:00" },
  { value: "丑时", label: "丑时", range: "01:00–03:00" },
  { value: "寅时", label: "寅时", range: "03:00–05:00" },
  { value: "卯时", label: "卯时", range: "05:00–07:00" },
  { value: "辰时", label: "辰时", range: "07:00–09:00" },
  { value: "巳时", label: "巳时", range: "09:00–11:00" },
  { value: "午时", label: "午时", range: "11:00–13:00" },
  { value: "未时", label: "未时", range: "13:00–15:00" },
  { value: "申时", label: "申时", range: "15:00–17:00" },
  { value: "酉时", label: "酉时", range: "17:00–19:00" },
  { value: "戌时", label: "戌时", range: "19:00–21:00" },
  { value: "亥时", label: "亥时", range: "21:00–23:00" },
];

function shichenToTime(shichen: Shichen): string {
  const map: Record<Shichen, string> = {
    子时: "00:00", 丑时: "02:00", 寅时: "04:00", 卯时: "06:00",
    辰时: "08:00", 巳时: "10:00", 午时: "12:00", 未时: "14:00",
    申时: "16:00", 酉时: "18:00", 戌时: "20:00", 亥时: "22:00",
  };
  return map[shichen];
}

export default function BirthInfoPage() {
  const router = useRouter();
  const setUserProfile = useSoulmapStore((s) => s.setUserProfile);
  const [birthDate, setBirthDate] = useState("");
  const [shichen, setShichen] = useState<Shichen>("午时");
  const [gender, setGender] = useState<"male" | "female">("female");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfile({
      birthDate,
      birthTime: shichenToTime(shichen),
      shichen,
      gender,
    });
    router.push("/onboarding/context");
  };

  const isValid = birthDate.length === 10;

  return (
    <div className="min-h-screen px-6 py-12">
      <Link
        href="/onboarding"
        className="text-sm text-violet-500 hover:text-violet-700"
      >
        ← Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md pt-8"
      >
        <h2 className="font-serif text-2xl text-violet-800">Birth Information</h2>
        <p className="mt-2 text-violet-600">
          Your BaZi chart is calculated from your exact birth moment.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-violet-700">
              Date of birth
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 placeholder-violet-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-700">
              Time of birth (2-hour window)
            </label>
            <p className="mt-1 text-xs text-violet-500">
              Don&apos;t know exactly? Choose the closest 2-hour window.
            </p>
            <select
              value={shichen}
              onChange={(e) => setShichen(e.target.value as Shichen)}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {SHICHEN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.range}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-700">
              Gender
            </label>
            <p className="mt-1 text-xs text-violet-500">
              Affects Luck Pillar direction in BaZi.
            </p>
            <div className="mt-2 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                  className="text-violet-600"
                />
                <span className="text-violet-700">Female</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                  className="text-violet-600"
                />
                <span className="text-violet-700">Male</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded-full bg-violet-600 py-4 font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}
