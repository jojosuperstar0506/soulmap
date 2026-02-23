"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectBaziChart, selectCurrentProfile } from "@/store/useSoulmapStore";
import {
  getSparkForDate,
  getElementForDate,
  SPARK_PROMPTS,
  type SparkPrompt,
} from "@/content/spark-prompts";
import {
  getStoredStreak,
  getStoredLastCompleted,
  getStoredWeekElements,
  markSparkCompleted,
  hasCompletedToday,
} from "@/lib/spark-utils";
import type { Element } from "@/types/bazi";
import type { SacredText } from "@/types/library";

const ELEMENT_EMOJI: Record<Element, string> = {
  wood: "🪵",
  fire: "🔥",
  earth: "🗿",
  metal: "🪙",
  water: "💧",
};

const ELEMENT_LABELS: Record<Element, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
};

export default function SparkPage() {
  const baziChart = useSoulmapStore(selectBaziChart);
  const currentProfile = useSoulmapStore(useShallow(selectCurrentProfile));
  const [today] = useState<Date>(() => new Date());
  const [streak, setStreak] = useState(() => getStoredStreak());
  const [lastCompleted, setLastCompleted] = useState<string | null>(() => getStoredLastCompleted());
  const [weekElements, setWeekElements] = useState<Element[]>(() => getStoredWeekElements().elements);
  const [completedToday, setCompletedToday] = useState(() => hasCompletedToday());
  const [expanded, setExpanded] = useState(false);
  const [sparkTodayPayload, setSparkTodayPayload] = useState<{
    sacredTextId: string | null;
    whyText: string | null;
    promptIndex: number | null;
    whyPromptLine: string | null;
  } | null>(null);
  const [sacredText, setSacredText] = useState<SacredText | null>(null);

  const analysis = currentProfile?.blueprintAnalysis;
  const hasAnalysis = analysis && baziChart?.luckPillars;
  const activeSparkTodayPayload = hasAnalysis ? sparkTodayPayload : null;
  const activeSacredText = hasAnalysis ? sacredText : null;

  const fallbackSpark = getSparkForDate(today);
  const spark: SparkPrompt =
    activeSparkTodayPayload?.promptIndex != null &&
    activeSparkTodayPayload.promptIndex >= 0 &&
    activeSparkTodayPayload.promptIndex < SPARK_PROMPTS.length
      ? SPARK_PROMPTS[activeSparkTodayPayload.promptIndex]
      : fallbackSpark;
  const todayElement = getElementForDate(today);

  useEffect(() => {
    if (!hasAnalysis) return;
    const dateStr = today.toISOString().slice(0, 10);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/spark/today", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blueprintAnalysis: analysis,
            chart: baziChart,
            date: dateStr,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        setSparkTodayPayload({
          sacredTextId: data.sacredTextId ?? null,
          whyText: data.whyText ?? null,
          promptIndex: data.promptIndex ?? null,
          whyPromptLine: data.whyPromptLine ?? null,
        });
        if (data.sacredTextId) {
          const listRes = await fetch("/api/library/texts");
          const listData = await listRes.json();
          const texts = (listData.items ?? []) as SacredText[];
          const found = texts.find((t: SacredText) => t.id === data.sacredTextId);
          if (!cancelled) setSacredText(found ?? null);
        } else {
          setSacredText(null);
        }
      } catch {
        if (!cancelled) {
          setSparkTodayPayload(null);
          setSacredText(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasAnalysis, analysis, baziChart, today]);

  const handleComplete = () => {
    const { newStreak, elementsThisWeek } = markSparkCompleted(today);
    setStreak(newStreak);
    setWeekElements(elementsThisWeek);
    setCompletedToday(true);
    setLastCompleted(today.toISOString().slice(0, 10));
  };

  const missedYesterday = (() => {
    if (!lastCompleted) return false;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    return lastCompleted !== yesterdayStr && !completedToday && streak > 0;
  })();

  const harmonyBadge = weekElements.length >= 5;

  return (
    <div className="px-6 py-8 pb-24 bg-[var(--parchment)]">
      <h2 className="font-display text-xl text-[var(--text-accent)]">Daily Spark</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        One prompt a day to build awareness and reflection.
      </p>

      {/* Streak & Element Collector */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border border-[var(--border)] bg-[var(--card-surface)] p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-[var(--foreground)]">
            {streak} day{streak !== 1 ? "s" : ""} of awareness
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(["wood", "fire", "earth", "metal", "water"] as Element[]).map(
            (el) => (
              <span
                key={el}
                title={ELEMENT_LABELS[el]}
                className={`text-xl ${weekElements.includes(el) ? "opacity-100" : "opacity-30"}`}
              >
                {ELEMENT_EMOJI[el]}
              </span>
            )
          )}
          <span className="ml-2 text-xs text-[var(--foreground-muted)]">
            This week: {weekElements.length}/5
          </span>
        </div>
        {harmonyBadge && (
          <span className="border border-[var(--ochre)] bg-[color-mix(in_srgb,var(--ochre)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
            ✦ Harmony
          </span>
        )}
      </div>

      {missedYesterday && (
        <p className="mt-4 text-center text-sm text-[var(--foreground-muted)]">
          Welcome back. Today&apos;s spark was waiting for you.
        </p>
      )}

      {/* Today's sacred text (when AI payload available) */}
      {activeSacredText && activeSparkTodayPayload?.whyText && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border border-[var(--border)] bg-[var(--card-surface)] p-6"
        >
          <h3 className="font-display text-lg text-[var(--text-accent)]">
            Today&apos;s sacred text
          </h3>
          <p className="mt-2 font-display italic text-[var(--foreground)]">
            &ldquo;{activeSacredText.englishText}&rdquo;
          </p>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">{activeSacredText.title}</p>
          <p className="mt-3 text-sm text-[var(--foreground)]">
            Why this speaks to you today: {activeSparkTodayPayload.whyText}
          </p>
        </motion.div>
      )}

      {/* Today's Spark Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 border border-[var(--border)] bg-[var(--card-surface)] p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[var(--foreground)]">
            Today&apos;s element: {ELEMENT_EMOJI[todayElement]}{" "}
            {ELEMENT_LABELS[todayElement]}
          </span>
        </div>

        <h3 className="mt-4 font-display text-lg text-[var(--text-accent)]">
          Reflection
        </h3>
        <p className="mt-2 text-[var(--foreground)]">{spark.reflectionPrompt}</p>
        {activeSparkTodayPayload?.whyPromptLine && (
          <p className="mt-2 text-sm italic text-[var(--foreground)]">
            Why today&apos;s spark fits you: {activeSparkTodayPayload.whyPromptLine}
          </p>
        )}

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm font-medium text-[var(--foreground)] hover:text-[var(--foreground)]"
        >
          {expanded ? "Hide" : "Show"} micro-practice
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4  bg-[var(--warm-ivory)] p-4"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
              {spark.microPractice.type} · {spark.microPractice.durationMinutes} min
            </p>
            <p className="mt-2 text-[var(--foreground)]">
              {spark.microPractice.instructions}
            </p>
          </motion.div>
        )}

        {!completedToday ? (
          <button
            onClick={handleComplete}
            className="mt-6 w-full border border-[var(--border)] bg-[var(--primary)] py-3 font-medium text-[var(--page-bg)] transition-colors duration-200 hover:bg-[var(--terracotta)]"
          >
            I did today&apos;s spark
          </button>
        ) : (
          <p className="mt-6 text-center text-sm font-medium text-[var(--foreground)]">
            ✓ Done for today
          </p>
        )}
      </motion.div>
    </div>
  );
}
