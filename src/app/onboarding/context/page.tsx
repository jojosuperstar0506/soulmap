"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectUserProfile } from "@/store/useSoulmapStore";

const OCCUPATIONS = [
  "Student",
  "Professional",
  "Creative",
  "Entrepreneur",
  "Between Things",
  "Other",
];

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Dating",
  "In a Relationship",
  "Married",
  "It's Complicated",
  "Prefer Not to Say",
];

export default function LifeContextPage() {
  const router = useRouter();
  const userProfile = useSoulmapStore(useShallow(selectUserProfile));
  const setUserProfile = useSoulmapStore((s) => s.setUserProfile);
  const setPendingProfileName = useSoulmapStore((s) => s.setPendingProfileName);
  const [profileName, setProfileName] = useState("");
  const [occupation, setOccupation] = useState(userProfile?.occupation ?? "");
  const [relationshipStatus, setRelationshipStatus] = useState(
    userProfile?.relationshipStatus ?? ""
  );
  const [currentConcern, setCurrentConcern] = useState(
    userProfile?.currentConcern ?? ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingProfileName(profileName.trim() || "Me");
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        occupation: occupation || undefined,
        relationshipStatus: relationshipStatus || undefined,
        currentConcern: currentConcern || undefined,
      });
    }
    router.push("/onboarding/generating");
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <Link
        href="/onboarding/birth"
        className="text-sm text-violet-500 hover:text-violet-700"
      >
        ← Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md pt-8"
      >
        <h2 className="font-serif text-2xl text-violet-800">Life Context</h2>
        <p className="mt-2 text-violet-600">
          Optional — helps personalize your readings.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-violet-700">
              Name for this profile
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. Me, Mom, Dad, Boyfriend"
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 placeholder-violet-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-violet-700">
              What do you do?
            </label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Select...</option>
              {OCCUPATIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-700">
              Relationship status
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">Select...</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-violet-700">
              What&apos;s on your mind right now?
            </label>
            <textarea
              value={currentConcern}
              onChange={(e) => setCurrentConcern(e.target.value)}
              placeholder="Optional — seeds the AI context..."
              rows={3}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-violet-900 placeholder-violet-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-violet-600 py-4 font-medium text-white transition-colors hover:bg-violet-500"
          >
            Generate My Blueprint
          </button>
        </form>
      </motion.div>
    </div>
  );
}
