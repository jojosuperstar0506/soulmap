"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useSoulmapStore,
  selectCurrentProfile,
} from "@/store/useSoulmapStore";

export default function ProfilesPage() {
  const router = useRouter();
  const profiles = useSoulmapStore((s) => s.profiles);
  const currentProfile = useSoulmapStore(selectCurrentProfile);
  const setCurrentProfileId = useSoulmapStore((s) => s.setCurrentProfileId);
  const removeProfile = useSoulmapStore((s) => s.removeProfile);
  const clearDraft = useSoulmapStore((s) => s.clearDraft);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSwitch = (id: string) => {
    setCurrentProfileId(id);
    router.push("/app/blueprint");
  };

  const handleRemove = (id: string) => {
    if (confirmDelete === id) {
      removeProfile(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <div className="px-6 py-8 pb-24">
      <h2 className="font-display text-xl text-[var(--text-accent)]">Profiles</h2>
      <p className="mt-2 text-sm text-violet-600">
        Switch between profiles or add someone else&apos;s chart (e.g. Mom, Dad, partner).
      </p>

      <div className="mt-6 space-y-3">
        {profiles.map((p) => (
          <motion.div
            key={p.id}
            layout
            className={`rounded-xl border p-4 ${
              currentProfile?.id === p.id
                ? "border-violet-400 bg-violet-100"
                : "border-violet-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-violet-800">{p.name}</p>
                <p className="mt-1 text-xs text-violet-500">
                  {p.birthDate} · {p.shichen} · {p.gender === "female" ? "F" : "M"}
                  {p.baziChart && (
                    <span className="ml-2 text-violet-500">
                      · {p.baziChart.soulType.primaryType}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentProfile?.id !== p.id && (
                  <button
                    onClick={() => handleSwitch(p.id)}
                    className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                  >
                    Switch
                  </button>
                )}
                {currentProfile?.id === p.id && (
                  <span className="text-xs font-medium text-violet-600">Current</span>
                )}
                <button
                  onClick={() => handleRemove(p.id)}
                  className={`rounded-full px-3 py-2 text-sm ${
                    confirmDelete === p.id
                      ? "bg-red-600 text-white"
                      : "border border-violet-200 text-violet-500 hover:text-red-500"
                  }`}
                >
                  {confirmDelete === p.id ? "Confirm delete?" : "Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        href="/onboarding"
        onClick={() => clearDraft()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 py-6 text-violet-500 hover:border-violet-400 hover:bg-violet-50/50"
      >
        <span className="text-lg">+</span>
        Add profile
      </Link>
    </div>
  );
}
