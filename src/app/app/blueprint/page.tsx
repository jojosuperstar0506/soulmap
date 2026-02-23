"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectBaziChart, selectCurrentProfile } from "@/store/useSoulmapStore";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import type { Element } from "@/types/bazi";
import { getLuckPillarInterpretation } from "@/lib/luck-pillar-labels";
import { getPersonaImagePath } from "@/lib/persona-images";
import Image from "next/image";
import type { HeavenlyStem, EarthlyBranch, LuckPillar, CurrentLuckAspects } from "@/types/bazi";
import { getTenGod, STEM_MAP, ELEMENT_CHINESE } from "@/lib/bazi-calculator";
import {
  getLifeStage,
  getKongWang,
  getNaYin,
  getShenShaForPillar,
  CHART_ROW_LABELS,
} from "@/lib/bazi-advanced";

/** Labels for 大运 life aspects (紫微斗数 style). */
const LUCK_ASPECT_LABELS: Record<keyof CurrentLuckAspects, string> = {
  wealth: "Wealth (财帛)",
  love: "Love & partner (夫妻)",
  career: "Career (官禄)",
  friends: "Friends & peers (奴仆)",
};

type LuckPhaseAnalysis = {
  theme: string;
  challenges: string[];
  solutions: string[];
  aspects: CurrentLuckAspects;
  generatedAt: string;
};

function PersonaImage({
  dayMaster,
  primaryType,
  elementEmoji,
  fullBleed = false,
}: {
  dayMaster: HeavenlyStem;
  primaryType: string;
  elementEmoji: string;
  fullBleed?: boolean;
}) {
  const [useFallback, setUseFallback] = useState(false);
  if (fullBleed) {
    if (useFallback) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--card-surface)]">
          <span className="text-6xl opacity-90">{elementEmoji}</span>
        </div>
      );
    }
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={getPersonaImagePath(dayMaster)}
          alt={primaryType}
          fill
          className="object-cover"
          sizes="(max-width: 512px) 100vw, 512px"
          unoptimized
          onError={() => setUseFallback(true)}
        />
      </div>
    );
  }
  if (useFallback) {
    return <span className="text-6xl opacity-90">{elementEmoji}</span>;
  }
  return (
    <div className="relative h-36 w-36 flex-shrink-0 overflow-hidden border border-[var(--border)]">
      <Image
        src={getPersonaImagePath(dayMaster)}
        alt={primaryType}
        fill
        className="object-cover"
        sizes="144px"
        unoptimized
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}

const ELEMENT_LABELS: Record<Element, string> = {
  wood: "Wood",
  fire: "Fire",
  earth: "Earth",
  metal: "Metal",
  water: "Water",
};

const ELEMENT_EMOJI: Record<Element, string> = {
  wood: "🪵",
  fire: "🔥",
  earth: "🗿",
  metal: "🪙",
  water: "💧",
};

const ELEMENT_COLORS: Record<Element, string> = {
  wood: "#7a8c6e",
  fire: "#c4622d",
  earth: "#d4a843",
  metal: "#8c8880",
  water: "#4a5e72",
};

// 地支五行 (Earthly Branch → element) for 地支 row coloring
const BRANCH_ELEMENT: Record<EarthlyBranch, Element> = {
  寅: "wood", 卯: "wood", 巳: "fire", 午: "fire", 申: "metal", 酉: "metal",
  亥: "water", 子: "water", 辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
};

export default function BlueprintPage() {
  const baziChart = useSoulmapStore(selectBaziChart);
  const currentProfile = useSoulmapStore(useShallow(selectCurrentProfile));
  const updateProfile = useSoulmapStore((s) => s.updateProfile);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedLuckIdx, setSelectedLuckIdx] = useState<number | null>(null);
  const [luckPhaseByKey, setLuckPhaseByKey] = useState<Record<string, LuckPhaseAnalysis>>({});
  const [luckPhaseLoadingKey, setLuckPhaseLoadingKey] = useState<string | null>(null);
  const [luckPhaseError, setLuckPhaseError] = useState<string | null>(null);
  const hasTriggeredAutoGenerate = useRef<string | null>(null);

  const luckKey = (lp: LuckPillar) => `${lp.startYear}-${lp.stem}${lp.branch}`;

  // Auto-generate narrative once per profile when chart exists and no analysis yet. No regenerate — one-time only.
  useEffect(() => {
    if (!currentProfile?.id || !baziChart?.luckPillars || currentProfile.blueprintAnalysis) return;
    if (hasTriggeredAutoGenerate.current === currentProfile.id) return;
    hasTriggeredAutoGenerate.current = currentProfile.id;
    setAnalysisLoading(true);
    setAnalysisError(null);
    (async () => {
      try {
        const res = await fetch("/api/blueprint/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chart: baziChart,
            currentConcern: currentProfile.currentConcern,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        updateProfile(currentProfile.id, { blueprintAnalysis: data.analysis });
      } catch (e) {
        setAnalysisError(e instanceof Error ? e.message : "Failed to generate analysis.");
      } finally {
        setAnalysisLoading(false);
      }
    })();
  }, [currentProfile?.id, currentProfile?.blueprintAnalysis, currentProfile?.currentConcern, baziChart, updateProfile]);

  const LUCK_PHASE_FETCH_TIMEOUT_MS = 90_000;

  const ensureLuckPhaseAnalysis = async (lp: LuckPillar) => {
    if (!baziChart) return;
    const key = luckKey(lp);
    if (luckPhaseByKey[key]) return;
    if (luckPhaseLoadingKey === key) return;
    setLuckPhaseError(null);
    setLuckPhaseLoadingKey(key);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LUCK_PHASE_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch("/api/blueprint/luck-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: baziChart,
          luckPillar: lp,
          currentConcern: currentProfile?.currentConcern,
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
      setLuckPhaseByKey((prev) => ({ ...prev, [key]: data.analysis as LuckPhaseAnalysis }));
    } catch (e) {
      const message =
        e instanceof Error
          ? e.name === "AbortError"
            ? "Request timed out. Please try again."
            : e.message
          : "Failed to generate phase analysis.";
      setLuckPhaseError(message);
    } finally {
      clearTimeout(timeoutId);
      setLuckPhaseLoadingKey(null);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1080,
        height: 1350,
        style: { backgroundColor: "#f8f4ff" },
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "soulmap-blueprint.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  };

  if (!baziChart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-[var(--foreground-muted)]">No chart data. Complete onboarding first.</p>
      </div>
    );
  }

  const {
    soulType,
    elementBalance,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    luckPillars,
    hiddenStems,
    tenGods,
  } = baziChart;

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar] as const;
  const pillarLabelsEn = ["Year", "Month", "Day", "Hour"] as const;
  const pillarLabels = ["年柱", "月柱", "日柱", "时柱"] as const;
  const hiddenStemsByPillar = [hiddenStems.year, hiddenStems.month, hiddenStems.day, hiddenStems.hour] as const;
  const mainStars: (string | null)[] = [
    tenGods.yearStem,
    tenGods.monthStem,
    "日主",
    tenGods.hourStem,
  ];
  const cangGanDisplay = (stems: readonly HeavenlyStem[]) =>
    stems.map((s) => `${s}${ELEMENT_CHINESE[STEM_MAP[s].element]}`).join(" ");
  const fuXingDisplay = (stems: readonly HeavenlyStem[]) =>
    stems.map((s) => getTenGod(dayMaster, s)).join(" ");
  const dayMasterElement = baziChart.dayMasterElement;
  const kongWang = getKongWang(dayPillar.branch);

  const currentYear = new Date().getFullYear();
  const blueprintAnalysis = currentProfile?.blueprintAnalysis ?? null;

  const handleGenerateAnalysis = async () => {
    if (!currentProfile?.id || !baziChart) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/blueprint/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chart: baziChart,
          currentConcern: currentProfile.currentConcern,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      updateProfile(currentProfile.id, { blueprintAnalysis: data.analysis });
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Failed to generate analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="px-6 py-8 pb-24 bg-[var(--page-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg"
      >
        {/* Persona Card — inner content is shareable */}
        <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--card-surface)] p-0">
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-surface)]/90 text-[var(--foreground)] shadow-sm transition hover:bg-[var(--warm-ivory)] disabled:opacity-50"
            aria-label="Share Blueprint"
          >
            {isSharing ? (
              <span className="text-sm">…</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            )}
          </button>
          <div ref={cardRef}>
          {/* Full-bleed image then dark band with archetype name */}
          <div className="relative h-56 w-full overflow-hidden bg-[var(--card-surface)]">
            <PersonaImage fullBleed dayMaster={dayMaster} primaryType={soulType.primaryType} elementEmoji={ELEMENT_EMOJI[soulType.element]} />
          </div>
          <div className="bg-[var(--hero-band-bg)] px-4 py-4">
            <p className="hero-band-label text-center mb-1.5" aria-hidden>
              Soul archetype
            </p>
            <h1 className="hero-text-on-dark text-center" style={{ color: 'var(--persona-accent)' }}>
              {soulType.primaryType.toUpperCase()}
            </h1>
          </div>

          <div className="px-6 pt-6 pb-10">
          <p className="mt-4 text-center text-base text-[var(--text-on-light-muted)]">
            {soulType.dayMasterChinese} · {soulType.dayMasterPinyin}{" "}
            {soulType.element.charAt(0).toUpperCase() + soulType.element.slice(1)}
          </p>

          <p className="mt-6 text-center font-display italic text-[var(--text-accent)]">
            &ldquo;{soulType.tagline}&rdquo;
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)]">
              Season: {soulType.seasonModifier}
            </span>
            <span className="border border-[var(--ochre)] bg-[color-mix(in_srgb,var(--ochre)_12%,transparent)] px-3 py-1 text-xs text-[var(--foreground)]">
              {soulType.dominantTenGod}
            </span>
            <span className="border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)]">
              Strength: {soulType.strength}
            </span>
          </div>

          {/* Life Chart 命盤 — Four Pillars with 主星, 天干, 地支, 藏干, 副星 */}
          <div className="mt-6 overflow-x-auto border border-[var(--border)] bg-[var(--card-surface)]">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--dark-section)]">
                  <th className="w-24 border border-[var(--border)] py-2 pl-3 text-left text-xs font-medium text-[var(--text-on-dark)]"></th>
                  {pillarLabels.map((l, i) => (
                    <th key={i} className="border border-[var(--border)] py-2 text-center text-xs font-medium text-[var(--text-on-dark)]">
                      {l} ({pillarLabelsEn[i]})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[var(--foreground)]">
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.mainStar.cn} ({CHART_ROW_LABELS.mainStar.en})</td>
                  {mainStars.map((s, i) => (
                    <td key={i} className="border border-[var(--border)] py-2 text-center text-xs font-mono">
                      {s}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.stem.cn} ({CHART_ROW_LABELS.stem.en})</td>
                  {pillars.map((p, i) => (
                    <td key={i} className="border border-[var(--border)] py-2 text-center">
                      <span
                        className="font-display inline-flex items-center justify-center border px-1.5 py-0.5 text-sm font-normal"
                        style={{
                          borderColor: ELEMENT_COLORS[STEM_MAP[p.stem].element],
                          backgroundColor: `${ELEMENT_COLORS[STEM_MAP[p.stem].element]}18`,
                          color: ELEMENT_COLORS[STEM_MAP[p.stem].element],
                        }}
                      >
                        {p.stem}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.branch.cn} ({CHART_ROW_LABELS.branch.en})</td>
                  {pillars.map((p, i) => {
                    const el = BRANCH_ELEMENT[p.branch];
                    return (
                      <td key={i} className="border border-[var(--border)] py-2 text-center">
                        <span
                          className="font-mono inline-flex items-center justify-center border px-1.5 py-0.5 text-sm"
                          style={{
                            borderColor: ELEMENT_COLORS[el],
                            backgroundColor: `${ELEMENT_COLORS[el]}18`,
                            color: ELEMENT_COLORS[el],
                          }}
                        >
                          {p.branch}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.hiddenStems.cn} ({CHART_ROW_LABELS.hiddenStems.en})</td>
                  {hiddenStemsByPillar.map((stems, i) => (
                    <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                      {cangGanDisplay(stems)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.secondaryStars.cn} ({CHART_ROW_LABELS.secondaryStars.en})</td>
                  {hiddenStemsByPillar.map((stems, i) => (
                    <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                      {fuXingDisplay(stems)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.lifeStage.cn} ({CHART_ROW_LABELS.lifeStage.en})</td>
                  {pillars.map((p, i) => {
                    const ls = getLifeStage(dayMasterElement, p.branch);
                    return (
                      <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                        {ls.cn} ({ls.en})
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.selfSitting.cn} ({CHART_ROW_LABELS.selfSitting.en})</td>
                  {pillars.map((p, i) => {
                    const el = STEM_MAP[p.stem].element;
                    const ls = getLifeStage(el, p.branch);
                    return (
                      <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                        {ls.cn} ({ls.en})
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.kongWang.cn} ({CHART_ROW_LABELS.kongWang.en})</td>
                  {pillars.map((_, i) => (
                    <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                      {kongWang.branches.join(" ")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.naYin.cn} ({CHART_ROW_LABELS.naYin.en})</td>
                  {pillars.map((p, i) => {
                    const ny = getNaYin(p.stem, p.branch);
                    return (
                      <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                        {ny.cn} ({ny.en})
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="border border-[var(--border)] py-2 pl-3 font-mono text-xs text-[var(--foreground-muted)]">{CHART_ROW_LABELS.shenSha.cn} ({CHART_ROW_LABELS.shenSha.en})</td>
                  {pillars.map((p, i) => {
                    const ss = getShenShaForPillar(p.branch, yearPillar.branch);
                    return (
                      <td key={i} className="border border-[var(--border)] py-2 text-center text-xs leading-tight font-mono">
                        {ss.length ? ss.map((s) => `${s.cn} (${s.en})`).join(", ") : "—"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Five Elements */}
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-medium text-[var(--text-accent)]">
              Five Elements Balance
            </h3>
            <div className="space-y-3">
              {(
                ["wood", "fire", "earth", "metal", "water"] as Element[]
              ).map((el) => (
                <div key={el} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-[var(--foreground)]">
                    {ELEMENT_EMOJI[el]} {ELEMENT_LABELS[el]}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--warm-ivory)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${elementBalance[el]}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: ELEMENT_COLORS[el] }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-medium text-[var(--foreground)]">
                    {elementBalance[el]}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your narrative — directly below Five Elements */}
          <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
            <h3 className="mb-4 font-display text-lg text-[var(--text-accent)]">
              Your narrative
            </h3>
            {blueprintAnalysis ? (
              <div className="space-y-4 text-[var(--foreground)]">
                <p className="leading-relaxed">{blueprintAnalysis.summary}</p>
                <p><span className="text-[var(--foreground-muted)] font-medium">Theme: </span>{blueprintAnalysis.theme}</p>
                <p><span className="text-[var(--foreground-muted)] font-medium">Challenge: </span>{blueprintAnalysis.challenge}</p>
                <p><span className="text-[var(--foreground-muted)] font-medium">Strength: </span>{blueprintAnalysis.strength}</p>
              </div>
            ) : (
              <>
                {analysisError && (
                  <div className="mb-4">
                    <p className="text-sm text-red-500">{analysisError}</p>
                    {(analysisError.includes("GEMINI_API_KEY") || analysisError.includes("ANTHROPIC_API_KEY")) && (
                      <p className="mt-2 text-xs text-[var(--foreground)]">
                        Add GEMINI_API_KEY or ANTHROPIC_API_KEY to .env.local, then restart the dev server.
                      </p>
                    )}
                  </div>
                )}
                {analysisLoading ? (
                  <p className="py-4 text-center text-[var(--foreground)]">Generating your narrative…</p>
                ) : analysisError ? (
                  <button
                    onClick={handleGenerateAnalysis}
                    disabled={analysisLoading}
                    className="w-full bg-[var(--foreground)] text-[var(--parchment)] py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Try again
                  </button>
                ) : (
                  <p className="py-4 text-center text-[var(--foreground-muted)] text-sm">
                    Your narrative will appear here once generated. Used to personalize Wisdom Vault and Daily Spark.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
            SoulMap — soulmap.app
          </div>
          </div>
          </div>
        </div>

        {/* Your Life Seasons — 大运 Luck Pillar timeline */}
        {luckPillars.length > 0 && (
          <div className="mt-6 border border-[var(--border)] bg-[var(--card-surface)] p-6 ">
            <h3 className="mb-4 font-display text-lg text-[var(--text-accent)]">
              Your Life Seasons (大运)
            </h3>
            <p className="mb-4 text-sm text-[var(--foreground)]">
              Each column is a 10-year phase. It shows the start year + start age (like the reference screenshot). Tap a phase to open its theme, challenges, and solutions.
            </p>

            {luckPhaseError && (
              <p className="mb-3 text-xs text-red-500">{luckPhaseError}</p>
            )}

            <div className="overflow-x-auto border border-[var(--border)] bg-[var(--card-surface)]">
              <table className="w-full min-w-[860px] text-xs">
                <tbody className="text-[var(--foreground)]">
                  {(() => {
                    const rows: {
                      label: string;
                      render: (lp: (typeof luckPillars)[number], isCurrent: boolean) => ReactNode;
                    }[] = [
                      {
                        label: "Start year (起运年份)",
                        render: (lp) => <span className="font-medium">{lp.startYear}</span>,
                      },
                      {
                        label: "Start age (起运年龄)",
                        render: (lp) => (
                          <span className="font-medium">
                            {lp.startAge}y <span className="text-[var(--foreground-muted)]">({lp.startAge}岁)</span>
                          </span>
                        ),
                      },
                      {
                        label: "大运 (Luck Pillar)",
                        render: (lp, isCurrent) => (
                          <div>
                            <div className="text-sm font-semibold">
                              {lp.stem}
                              {lp.branch}
                              {isCurrent && (
                                <span className="ml-2 border border-[var(--ochre)] bg-[color-mix(in_srgb,var(--ochre)_12%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">
                              Age {lp.startAge}–{lp.startAge + 9} · {lp.startYear}–{lp.endYear}
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--foreground)]">
                              {getLuckPillarInterpretation(lp.stem)}
                            </div>
                          </div>
                        ),
                      },
                      {
                        label: "Love (感情)",
                        render: (lp, isCurrent) => {
                          const key = luckKey(lp);
                          const aspects = isCurrent
                            ? blueprintAnalysis?.currentLuckAspects ?? null
                            : luckPhaseByKey[key]?.aspects ?? null;
                          return (
                            <span className="text-[var(--foreground)]">
                              {aspects?.love ?? <span className="text-[var(--foreground-muted)]">Tap to generate</span>}
                            </span>
                          );
                        },
                      },
                      {
                        label: "Career & achievements (事业/成就)",
                        render: (lp, isCurrent) => {
                          const key = luckKey(lp);
                          const aspects = isCurrent
                            ? blueprintAnalysis?.currentLuckAspects ?? null
                            : luckPhaseByKey[key]?.aspects ?? null;
                          return (
                            <span className="text-[var(--foreground)]">
                              {aspects?.career ?? <span className="text-[var(--foreground-muted)]">Tap to generate</span>}
                            </span>
                          );
                        },
                      },
                      {
                        label: "Wealth (财富)",
                        render: (lp, isCurrent) => {
                          const key = luckKey(lp);
                          const aspects = isCurrent
                            ? blueprintAnalysis?.currentLuckAspects ?? null
                            : luckPhaseByKey[key]?.aspects ?? null;
                          return (
                            <span className="text-[var(--foreground)]">
                              {aspects?.wealth ?? <span className="text-[var(--foreground-muted)]">Tap to generate</span>}
                            </span>
                          );
                        },
                      },
                      {
                        label: "Relationships & support (人际)",
                        render: (lp, isCurrent) => {
                          const key = luckKey(lp);
                          const aspects = isCurrent
                            ? blueprintAnalysis?.currentLuckAspects ?? null
                            : luckPhaseByKey[key]?.aspects ?? null;
                          return (
                            <span className="text-[var(--foreground)]">
                              {aspects?.friends ?? <span className="text-[var(--foreground-muted)]">Tap to generate</span>}
                            </span>
                          );
                        },
                      },
                    ];

                    return rows.map((row, rowIdx) => (
                      <tr key={row.label} className={rowIdx === rows.length - 1 ? "" : "border-b border-[var(--border-subtle)]"}>
                        <td className="w-44 bg-[var(--warm-ivory)] py-3 pl-3 pr-2 align-top text-[11px] font-medium text-[var(--foreground)]">
                          {row.label}
                        </td>
                        {luckPillars.map((lp, i) => {
                          const isCurrent = currentYear >= lp.startYear && currentYear <= lp.endYear;
                          const key = luckKey(lp);
                          const isLoading = luckPhaseLoadingKey === key;
                          const cellRing = isCurrent ? "ring-2 ring-amber-300" : "";
                          const isStaticRow = rowIdx < 3;
                          const showLoading = isLoading && !isStaticRow;
                          return (
                            <td key={key} className="p-0 align-top">
                              <button
                                type="button"
                                onClick={async () => {
                                  setSelectedLuckIdx(i);
                                  await ensureLuckPhaseAnalysis(lp);
                                }}
                                className={`block w-full px-3 py-3 text-left transition hover:bg-[var(--warm-ivory)] ${cellRing}`}
                                title="Tap to open this phase"
                              >
                                {showLoading ? (
                                  <span className="text-[var(--foreground-muted)]">Generating…</span>
                                ) : (
                                  row.render(lp, isCurrent)
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <AnimatePresence>
              {selectedLuckIdx !== null && luckPillars[selectedLuckIdx] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
                  onClick={() => {
                    setSelectedLuckIdx(null);
                    setLuckPhaseError(null);
                  }}
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-[var(--border)] bg-[var(--card-surface)] "
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const lp = luckPillars[selectedLuckIdx];
                      const key = luckKey(lp);
                      const analysis = luckPhaseByKey[key] ?? null;
                      const isCurrent = currentYear >= lp.startYear && currentYear <= lp.endYear;
                      return (
                        <>
                          <div className="shrink-0 p-5 pb-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-display text-lg text-[var(--text-accent)]">
                                  大运 {lp.stem}{lp.branch}{" "}
                                <span className="text-sm text-[var(--foreground-muted)]">
                                  (Age {lp.startAge}–{lp.startAge + 9}, {lp.startYear}–{lp.endYear})
                                </span>
                              </h4>
                              <p className="mt-1 text-xs text-[var(--foreground)]">
                                {analysis ? "Theme, challenges, and solutions for this phase." : "Tap to generate a short reading for this phase."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLuckIdx(null);
                                setLuckPhaseError(null);
                              }}
                              className="border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] hover:bg-[var(--warm-ivory)]"
                            >
                              Close
                            </button>
                            </div>
                          </div>
                          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 pt-4 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                            {luckPhaseError && (
                              <p className="mb-3 text-sm text-red-600">{luckPhaseError}</p>
                            )}
                            {!analysis ? (
                              <button
                                type="button"
                                onClick={() => ensureLuckPhaseAnalysis(lp)}
                                disabled={luckPhaseLoadingKey === key}
                                className="w-full bg-[var(--foreground)] text-[var(--parchment)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {luckPhaseLoadingKey === key ? "Generating…" : "Generate this phase"}
                              </button>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <div className="text-xs font-semibold text-[var(--foreground)]">Theme</div>
                                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]">{analysis.theme}</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <div className="text-xs font-semibold text-[var(--foreground)]">Major challenges</div>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--foreground)]">
                                      {analysis.challenges.map((c, idx) => (
                                        <li key={idx}>{c}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-[var(--foreground)]">Solutions</div>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--foreground)]">
                                      {analysis.solutions.map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div className="border-2 border-[var(--border)] bg-[var(--warm-ivory)] p-3">
                                  <div className="mb-2 text-xs font-semibold text-[var(--foreground)]">
                                    By life area (紫微斗数 style)
                                  </div>
                                  <ul className="space-y-1.5 text-sm text-[var(--foreground)]">
                                    {(Object.keys(LUCK_ASPECT_LABELS) as (keyof CurrentLuckAspects)[]).map((k) => (
                                      <li key={k}>
                                        <span className="text-[var(--foreground)]">{LUCK_ASPECT_LABELS[k]}: </span>
                                        {analysis.aspects[k]}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <p className="text-[11px] text-[var(--foreground-muted)]">
                                  Generated {new Date(analysis.generatedAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </motion.div>
    </div>
  );
}
