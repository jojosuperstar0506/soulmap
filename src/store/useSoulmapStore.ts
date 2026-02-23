"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BaZiChart, UserProfile, Profile } from "@/types/bazi";

function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type Persisted = {
  profiles: Profile[];
  currentProfileId: string | null;
  pendingProfileName: string | null;
  draftUserProfile: UserProfile | null;
  draftBaziChart: BaZiChart | null;
};

function migrate(state: unknown, _version: number): Persisted {
  const any = state as Record<string, unknown> | undefined;
  if (!any) {
    return {
      profiles: [],
      currentProfileId: null,
      pendingProfileName: null,
      draftUserProfile: null,
      draftBaziChart: null,
    };
  }
  if (Array.isArray(any.profiles) && (any.profiles as Profile[]).length > 0) {
    return {
      profiles: any.profiles as Profile[],
      currentProfileId: (any.currentProfileId as string | null) ?? (any.profiles as Profile[])[0].id,
      pendingProfileName: (any.pendingProfileName as string | null) ?? null,
      draftUserProfile: (any.draftUserProfile as UserProfile | null) ?? null,
      draftBaziChart: (any.draftBaziChart as BaZiChart | null) ?? null,
    };
  }
  const up = any.userProfile as UserProfile | null | undefined;
  const chart = any.baziChart as BaZiChart | null | undefined;
  if (up && (chart || any.hasCompletedOnboarding)) {
    const id = generateId();
    const profile: Profile = {
      id,
      name: "Me",
      birthDate: up.birthDate,
      birthTime: up.birthTime,
      shichen: up.shichen,
      gender: up.gender,
      occupation: up.occupation,
      relationshipStatus: up.relationshipStatus,
      currentConcern: up.currentConcern,
      baziChart: chart ?? null,
      createdAt: Date.now(),
    };
    return {
      profiles: [profile],
      currentProfileId: id,
      pendingProfileName: null,
      draftUserProfile: null,
      draftBaziChart: null,
    };
  }
  return {
    profiles: (any.profiles as Profile[]) ?? [],
    currentProfileId: (any.currentProfileId as string | null) ?? null,
    pendingProfileName: (any.pendingProfileName as string | null) ?? null,
    draftUserProfile: (any.draftUserProfile as UserProfile | null) ?? null,
    draftBaziChart: (any.draftBaziChart as BaZiChart | null) ?? null,
  };
}

export interface SoulmapState extends Persisted {
  setUserProfile: (profile: UserProfile) => void;
  setBaziChart: (chart: BaZiChart) => void;
  setPendingProfileName: (name: string | null) => void;

  addProfile: (params: {
    name: string;
    userProfile: UserProfile;
    baziChart: BaZiChart;
  }) => string;
  updateProfile: (id: string, updates: Partial<Omit<Profile, "id" | "createdAt">>) => void;
  removeProfile: (id: string) => void;
  setCurrentProfileId: (id: string) => void;

  completeOnboarding: () => void;
  clearDraft: () => void;
  reset: () => void;
}

export const useSoulmapStore = create<SoulmapState>()(
  persist(
    (set, get) => ({
      profiles: [],
      currentProfileId: null,
      pendingProfileName: null,
      draftUserProfile: null,
      draftBaziChart: null,

      setUserProfile: (profile) => set({ draftUserProfile: profile }),
      setBaziChart: (chart) => set({ draftBaziChart: chart }),
      setPendingProfileName: (name) => set({ pendingProfileName: name }),

      addProfile: ({ name, userProfile, baziChart }) => {
        const id = generateId();
        const profile: Profile = {
          id,
          name,
          ...userProfile,
          baziChart,
          createdAt: Date.now(),
        };
        set((s) => ({
          profiles: [...s.profiles, profile],
          currentProfileId: id,
          pendingProfileName: null,
          draftUserProfile: null,
          draftBaziChart: null,
        }));
        return id;
      },
      updateProfile: (id, updates) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },
      removeProfile: (id) => {
        set((s) => {
          const next = s.profiles.filter((p) => p.id !== id);
          const nextCurrent =
            s.currentProfileId === id ? next[0]?.id ?? null : s.currentProfileId;
          return { profiles: next, currentProfileId: nextCurrent };
        });
      },
      setCurrentProfileId: (id) => set({ currentProfileId: id }),

      completeOnboarding: () => {
        const s = get();
        const up = s.draftUserProfile;
        const chart = s.draftBaziChart;
        if (up && chart) {
          get().addProfile({
            name: (s.pendingProfileName?.trim() || "Me"),
            userProfile: up,
            baziChart: chart,
          });
        } else {
          set({ pendingProfileName: null });
        }
      },
      clearDraft: () =>
        set({ draftUserProfile: null, draftBaziChart: null, pendingProfileName: null }),
      reset: () =>
        set({
          profiles: [],
          currentProfileId: null,
          pendingProfileName: null,
          draftUserProfile: null,
          draftBaziChart: null,
        }),
    }),
    {
      name: "soulmap-storage",
      partialize: (s) => ({
        profiles: s.profiles,
        currentProfileId: s.currentProfileId,
        pendingProfileName: s.pendingProfileName,
        draftUserProfile: s.draftUserProfile,
        draftBaziChart: s.draftBaziChart,
      }),
      migrate,
      version: 2,
    }
  )
);

// Selectors: derive current profile, userProfile, baziChart for backward compatibility
export function selectCurrentProfile(s: SoulmapState): Profile | null {
  if (!s.currentProfileId) return null;
  return s.profiles.find((p) => p.id === s.currentProfileId) ?? null;
}

export function selectUserProfile(s: SoulmapState): UserProfile | null {
  // During onboarding we're building a new profile in draft; prefer draft when set
  if (s.draftUserProfile) return s.draftUserProfile;
  const current = selectCurrentProfile(s);
  if (current) {
    return {
      birthDate: current.birthDate,
      birthTime: current.birthTime,
      shichen: current.shichen,
      gender: current.gender,
      occupation: current.occupation,
      relationshipStatus: current.relationshipStatus,
      currentConcern: current.currentConcern,
    };
  }
  return null;
}

export function selectBaziChart(s: SoulmapState): BaZiChart | null {
  const current = selectCurrentProfile(s);
  if (current?.baziChart) return current.baziChart;
  return s.draftBaziChart;
}

export function selectHasCompletedOnboarding(s: SoulmapState): boolean {
  return s.profiles.length > 0;
}
