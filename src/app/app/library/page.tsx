"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectBaziChart, selectUserProfile, selectCurrentProfile } from "@/store/useSoulmapStore";
import type { SacredText, Tradition, LibraryTheme, OracleBookmark } from "@/types/library";
import { THEME_LABELS, TRADITION_LABELS, TRADITION_INTROS, THEME_INTROS } from "@/content/library/texts";
import {
  loadWisdomVaultBookmarks,
  toggleSacredTextBookmark,
  removeOracleBookmark,
} from "@/lib/wisdom-vault-bookmarks";

const TRADITION_ICONS: Record<Tradition, string> = {
  daoism: "☯",
  buddhism: "☸",
  stoicism: "Σ",
  christianity: "✙",
  islam: "☪",
  judaism: "✡",
};

const TRADITION_CARD_COLORS: Record<
  Tradition,
  { bg: string; border: string; text: string }
> = {
  daoism: { bg: "rgba(196, 98, 45, 0.12)", border: "var(--terracotta)", text: "var(--foreground)" },
  buddhism: { bg: "rgba(122, 140, 110, 0.2)", border: "var(--sage)", text: "var(--foreground)" },
  stoicism: { bg: "rgba(74, 94, 114, 0.15)", border: "var(--slate-blue)", text: "var(--foreground)" },
  christianity: { bg: "rgba(212, 168, 67, 0.18)", border: "var(--ochre)", text: "var(--foreground)" },
  islam: { bg: "rgba(196, 98, 45, 0.1)", border: "var(--terracotta)", text: "var(--foreground)" },
  judaism: { bg: "rgba(74, 94, 114, 0.12)", border: "var(--slate-blue)", text: "var(--foreground)" },
};

type LibraryTab = "for_you" | "traditions" | "themes" | "bookmarks";

export default function LibraryPage() {
  const baziChart = useSoulmapStore(selectBaziChart);
  const userProfile = useSoulmapStore(useShallow(selectUserProfile));
  const currentProfile = useSoulmapStore(useShallow(selectCurrentProfile));
  const [tab, setTab] = useState<LibraryTab>("for_you");
  const [q, setQ] = useState("");
  const [selectedTradition, setSelectedTradition] = useState<Tradition | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<LibraryTheme | null>(null);
  const [items, setItems] = useState<SacredText[]>([]);
  const [categoryItems, setCategoryItems] = useState<SacredText[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [forYou, setForYou] = useState<SacredText[]>([]);
  const [curatedBlurbs, setCuratedBlurbs] = useState<Record<string, string>>({});
  const [active, setActive] = useState<SacredText | null>(null);
  const [vaultBookmarks, setVaultBookmarks] = useState<{ sacredTextIds: string[]; oracleBookmarks: OracleBookmark[] }>({ sacredTextIds: [], oracleBookmarks: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVaultBookmarks(loadWisdomVaultBookmarks());
  }, []);

  const refreshVaultBookmarks = () => setVaultBookmarks(loadWisdomVaultBookmarks());

  const isBookmarked = useMemo(() => {
    const set = new Set(vaultBookmarks.sacredTextIds);
    return (id: string) => set.has(id);
  }, [vaultBookmarks.sacredTextIds]);

  const toggleBookmark = (id: string) => {
    toggleSacredTextBookmark(id);
    refreshVaultBookmarks();
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/library/texts?${params.toString()}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q]);

  useEffect(() => {
    const run = async () => {
      const analysis = currentProfile?.blueprintAnalysis;
      const hasAnalysis = analysis && baziChart?.luckPillars;

      if (hasAnalysis) {
        try {
          const res = await fetch("/api/library/for-you/curate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blueprintAnalysis: analysis,
              chart: baziChart,
              currentConcern: userProfile?.currentConcern,
            }),
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.items) && data.items.length > 0) {
            const blurbs: Record<string, string> = {};
            const orderedIds: string[] = [];
            for (const x of data.items) {
              orderedIds.push(x.id);
              blurbs[x.id] = x.whyThisSpeaksToYouNow ?? "";
            }
            setCuratedBlurbs(blurbs);
            const allRes = await fetch("/api/library/texts");
            const allData = await allRes.json();
            const allTexts = (allData.items ?? []) as SacredText[];
            const byId = new Map(allTexts.map((t) => [t.id, t]));
            const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as SacredText[];
            setForYou(ordered);
            return;
          }
        } catch {
          /* fallback to rule-based */
        }
        setCuratedBlurbs({});
      } else {
        setCuratedBlurbs({});
      }

      const ctx = baziChart
        ? {
            elementBalance: baziChart.elementBalance,
            favorableElements: baziChart.favorableElements,
            currentConcern: userProfile?.currentConcern,
          }
        : { currentConcern: userProfile?.currentConcern };
      const res = await fetch("/api/library/for-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctx),
      });
      const data = await res.json();
      setForYou(data.items ?? []);
    };
    run();
  }, [baziChart, userProfile?.currentConcern, currentProfile?.blueprintAnalysis]);

  useEffect(() => {
    if (!selectedTradition && !selectedTheme) {
      setCategoryItems([]);
      return;
    }
    const run = async () => {
      setCategoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedTradition) params.set("tradition", selectedTradition);
        if (selectedTheme) params.set("theme", selectedTheme);
        const res = await fetch(`/api/library/texts?${params.toString()}`);
        const data = await res.json();
        setCategoryItems(data.items ?? []);
      } finally {
        setCategoryLoading(false);
      }
    };
    run();
  }, [selectedTradition, selectedTheme]);

  const sacredBookmarks = useMemo(() => {
    const set = new Set(vaultBookmarks.sacredTextIds);
    return items.filter((t) => set.has(t.id));
  }, [items, vaultBookmarks.sacredTextIds]);

  const themes = useMemo(() => {
    return Object.entries(THEME_LABELS) as [LibraryTheme, string][];
  }, []);

  return (
    <div className="min-h-full px-6 py-8 bg-[var(--page-bg)]">
      <h2 className="section-header text-[var(--text-on-light)]">Wisdom Vault</h2>
      <p className="mt-2 text-sm text-[var(--text-on-light-muted)]">
        Curated wisdom from world traditions, matched to your elemental state.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-transparent">
        {(
          [
            ["for_you", "For You"],
            ["traditions", "Traditions"],
            ["themes", "Themes"],
            ["bookmarks", "Bookmarks"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex min-h-[44px] items-center border-t-2 px-4 py-2 pt-2 text-sm font-medium transition-colors duration-200 ${
              tab === id
                ? "border-[var(--psychic-purple)] text-[var(--primary)]"
                : "border-transparent text-[var(--stone)] hover:text-[var(--primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles or text..."
          className="w-full border border-[var(--border)] bg-[var(--interactive-surface)] px-4 py-3 text-[var(--primary)] placeholder-[var(--tertiary)] focus:border-[var(--psychic-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--psychic-purple)] focus:ring-offset-2"
        />
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          Seed pack is included now; expanding to 120+ excerpts is a content task (the system is ready).
        </p>
      </div>

      <div className="mt-6">
        {loading && (
          <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>
        )}

        {tab === "for_you" && (
          <div className="space-y-3">
            {forYou.map((t) => (
              <TextCard
                key={t.id}
                t={t}
                bookmarked={isBookmarked(t.id)}
                whyThisSpeaksToYouNow={curatedBlurbs[t.id]}
                onOpen={() => setActive(t)}
                onBookmark={() => toggleBookmark(t.id)}
              />
            ))}
          </div>
        )}

        {tab === "traditions" && (
          <div className="space-y-6">
            {selectedTradition ? (
              <>
                <button
                  onClick={() => setSelectedTradition(null)}
                  className="text-sm text-[var(--foreground)] hover:text-[var(--foreground)]"
                >
                  ← Back to traditions
                </button>
                <div className="border border-[var(--border)] bg-[var(--card-surface)] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    {TRADITION_LABELS[selectedTradition]}
                  </p>
                  <p className="mt-2 leading-relaxed text-[var(--foreground)]">
                    {TRADITION_INTROS[selectedTradition]}
                  </p>
                </div>
                {categoryLoading ? (
                  <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>
                ) : categoryItems.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)]">No excerpts in this tradition yet.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryItems.map((t) => (
                      <TextCard
                        key={t.id}
                        t={t}
                        bookmarked={isBookmarked(t.id)}
                        whyThisSpeaksToYouNow={curatedBlurbs[t.id]}
                        onOpen={() => setActive(t)}
                        onBookmark={() => toggleBookmark(t.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(TRADITION_LABELS) as Tradition[]).map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setSelectedTradition(tr)}
                    className="flex flex-col items-center justify-center border py-8 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      backgroundColor: TRADITION_CARD_COLORS[tr].bg,
                      borderColor: TRADITION_CARD_COLORS[tr].border,
                      color: TRADITION_CARD_COLORS[tr].text,
                    }}
                  >
                    <span className="text-4xl opacity-80">{TRADITION_ICONS[tr]}</span>
                    <span className="mt-2 font-medium">{TRADITION_LABELS[tr]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "themes" && (
          <div className="space-y-6">
            {selectedTheme ? (
              <>
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="text-sm text-[var(--foreground)] hover:text-[var(--foreground)]"
                >
                  ← Back to themes
                </button>
                <div className="border border-[var(--border)] bg-[var(--card-surface)] p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    {THEME_LABELS[selectedTheme]}
                  </p>
                  <p className="mt-2 leading-relaxed text-[var(--foreground)]">
                    {THEME_INTROS[selectedTheme]}
                  </p>
                </div>
                {categoryLoading ? (
                  <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>
                ) : categoryItems.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)]">No excerpts in this theme yet.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryItems.map((t) => (
                      <TextCard
                        key={t.id}
                        t={t}
                        bookmarked={isBookmarked(t.id)}
                        whyThisSpeaksToYouNow={curatedBlurbs[t.id]}
                        onOpen={() => setActive(t)}
                        onBookmark={() => toggleBookmark(t.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {themes.map(([theme, label]) => (
                  <button
                    key={theme}
                    onClick={() => setSelectedTheme(theme)}
                    className="w-full border border-[var(--border)] bg-[var(--card-surface)] px-4 py-4 text-left transition-colors duration-200 hover:bg-[var(--primary)] hover:text-[var(--page-bg)]"
                  >
                    <p className="text-[var(--foreground)]">{label}</p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      Tap to explore excerpts in this theme.
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "bookmarks" && (
          <div className="space-y-3">
            {vaultBookmarks.oracleBookmarks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Oracle wisdom
                </p>
                {vaultBookmarks.oracleBookmarks.map((ob) => (
                  <OracleBookmarkCard
                    key={ob.id}
                    ob={ob}
                    onRemove={() => {
                      removeOracleBookmark(ob.id);
                      refreshVaultBookmarks();
                    }}
                  />
                ))}
              </div>
            )}
            {sacredBookmarks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Sacred excerpts
                </p>
                {sacredBookmarks.map((t) => (
                  <TextCard
                    key={t.id}
                    t={t}
                    bookmarked={true}
                    onOpen={() => setActive(t)}
                    onBookmark={() => toggleBookmark(t.id)}
                  />
                ))}
              </div>
            )}
            {vaultBookmarks.oracleBookmarks.length === 0 && sacredBookmarks.length === 0 && (
              <p className="text-sm text-[var(--foreground-muted)]">
                No bookmarks yet. Save Oracle answers or excerpts to build your Wisdom Vault.
              </p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--foreground)]/40 backdrop-blur-sm p-4"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg border border-[var(--border)] bg-[var(--card-surface)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {TRADITION_LABELS[active.tradition]} {TRADITION_ICONS[active.tradition]}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-[var(--text-accent)]">
                    {active.title}
                  </h3>
                  {active.source && (
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">{active.source}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleBookmark(active.id)}
                  className={`border border-[var(--border)] px-3 py-2 text-xs ${
                    isBookmarked(active.id)
                      ? "border-[var(--border)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--foreground)]"
                  }`}
                >
                  {isBookmarked(active.id) ? "Bookmarked" : "Bookmark"}
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {curatedBlurbs[active.id] && (
                  <p className="border border-[var(--ochre)] bg-[color-mix(in_srgb,var(--ochre)_12%,transparent)] px-3 py-2 text-sm italic text-[var(--foreground)]">
                    Why this speaks to you now: {curatedBlurbs[active.id]}
                  </p>
                )}
                <p className="whitespace-pre-line leading-relaxed text-[var(--foreground)]">
                  {active.englishText}
                </p>
                <div className="flex flex-wrap gap-2">
                  {active.themes.map((t) => (
                    <span
                      key={t}
                      className="border border-[var(--border)] bg-[var(--warm-ivory)] px-3 py-1 text-xs text-[var(--foreground)]"
                    >
                      {THEME_LABELS[t]}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActive(null)}
                className="mt-6 w-full bg-[var(--foreground)] py-3 font-medium text-[var(--parchment)] hover:opacity-90 transition-colors duration-300"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OracleBookmarkCard({
  ob,
  onRemove,
}: {
  ob: OracleBookmark;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-[var(--border)] bg-[var(--card-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => setExpanded(!expanded)} className="text-left flex-1 min-w-0">
          <p className="text-xs text-[var(--foreground-muted)]">Life Oracle</p>
          <p className="mt-1 font-medium text-[var(--foreground)] line-clamp-2">{ob.question}</p>
        </button>
        <button
          onClick={onRemove}
          className="shrink-0  border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)] hover:bg-[var(--warm-ivory)]"
        >
          Remove
        </button>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{ob.answer}</p>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        {expanded ? "Show less" : "Show answer"}
      </button>
    </div>
  );
}

function TextCard({
  t,
  bookmarked,
  whyThisSpeaksToYouNow,
  onOpen,
  onBookmark,
}: {
  t: SacredText;
  bookmarked: boolean;
  whyThisSpeaksToYouNow?: string;
  onOpen: () => void;
  onBookmark: () => void;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--card-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <button onClick={onOpen} className="text-left">
          <p className="text-xs text-[var(--foreground-muted)]">
            {TRADITION_LABELS[t.tradition]}
          </p>
          <p className="mt-1 font-medium text-[var(--foreground)]">{t.title}</p>
        </button>
        <button
          onClick={onBookmark}
          className={`border border-[var(--border)] px-3 py-2 text-xs ${
            bookmarked
              ? "border-[var(--border)] text-[var(--foreground)]"
              : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--warm-ivory)]"
          }`}
        >
          {bookmarked ? "Saved" : "Save"}
        </button>
      </div>
      <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm leading-relaxed text-[var(--foreground)]">
        {t.englishText}
      </p>
      {whyThisSpeaksToYouNow && (
        <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-xs italic text-[var(--foreground)]">
          Why this speaks to you now: {whyThisSpeaksToYouNow}
        </p>
      )}
    </div>
  );
}
