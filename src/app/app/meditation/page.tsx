"use client";

import { useState, useRef } from "react";
import {
  MEDITATION_EPISODES,
  ELEMENT_TABS,
  MEDITATION_SOURCE_LABEL,
  MEDITATION_SOURCE_URL,
  type MeditationElement,
  type MeditationEpisode,
} from "@/content/meditation-episodes";

function filterByElement(episodes: MeditationEpisode[], element: MeditationElement | "all") {
  if (element === "all") return episodes;
  return episodes.filter((e) => e.elements.includes(element));
}

export default function MeditationPage() {
  const [activeTab, setActiveTab] = useState<MeditationElement | "all">("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const list = filterByElement(MEDITATION_EPISODES, activeTab);

  const handlePlay = (ep: MeditationEpisode) => {
    if (playingId === ep.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(ep.audioUrl);
    audioRef.current = audio;
    audio.play().catch((err) => console.warn("Audio play failed:", err));
    setPlayingId(ep.id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  return (
    <div className="px-6 py-8 pb-24 bg-[var(--parchment)]">
      <h2 className="font-display text-xl text-[var(--text-accent)]">Still Point</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Guided meditation matched to your elemental balance. Open-source audio from{" "}
        <a
          href={MEDITATION_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[var(--text-accent)] hover:opacity-80"
        >
          {MEDITATION_SOURCE_LABEL}
        </a>
        .
      </p>

      {/* Tabs: All + by element */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "all"
              ? "bg-[var(--foreground)] text-[var(--parchment)]"
              : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-surface)]"
          }`}
        >
          All
        </button>
        {ELEMENT_TABS.map(({ element, label, emoji }) => (
          <button
            key={element}
            type="button"
            onClick={() => setActiveTab(element)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === element
                ? "bg-[var(--foreground)] text-[var(--parchment)]"
                : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-surface)]"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Episode list */}
      <div className="mt-6 space-y-3">
        {list.map((ep) => (
          <div
            key={ep.id}
            className="flex items-center gap-4 border border-[var(--border)] bg-[var(--card-surface)] px-4 py-4"
          >
            <button
              type="button"
              onClick={() => handlePlay(ep)}
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--card-surface)] text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-[var(--page-bg)] transition-colors duration-300"
              aria-label={playingId === ep.id ? "Pause" : "Play"}
            >
              {playingId === ep.id ? (
                <span className="text-lg">⏸</span>
              ) : (
                <span className="ml-0.5 text-lg">▶</span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--text-accent)]">{ep.title}</p>
              <p className="text-sm text-[var(--text-accent)] opacity-90">
                {ep.theme} · {ep.durationLabel} · {ep.author}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[var(--text-accent)] opacity-80">{ep.durationLabel}</span>
            <a
              href={ep.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--card-surface)]"
            >
              Open
            </a>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
        Audio: {MEDITATION_SOURCE_LABEL} (CC BY-NC-SA 3.0). Non-commercial use; credit required.
      </p>
    </div>
  );
}
