"use client";

import { useState, useRef, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSoulmapStore, selectBaziChart, selectUserProfile, selectCurrentProfile } from "@/store/useSoulmapStore";
import { motion } from "framer-motion";
import { addOracleBookmark } from "@/lib/wisdom-vault-bookmarks";
import { renderMarkdownInline } from "@/lib/render-markdown-inline";

const STARTER_QUESTIONS = [
  "What career paths suit my chart?",
  "Is this a good year for big changes?",
  "What should I know about my love life?",
  "How do I handle my current stress?",
  "What does my chart say about money?",
];

const MAX_FREE_MESSAGES = 50; // Raised for testing; reduce for production
const ORACLE_COUNT_KEY = "soulmap-oracle-message-count";

function getStoredCount(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(ORACLE_COUNT_KEY);
  return v ? parseInt(v, 10) : 0;
}

function setStoredCount(n: number) {
  if (typeof window !== "undefined") localStorage.setItem(ORACLE_COUNT_KEY, String(n));
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OraclePage() {
  const baziChart = useSoulmapStore(selectBaziChart);
  const userProfile = useSoulmapStore(useShallow(selectUserProfile));
  const currentProfile = useSoulmapStore(useShallow(selectCurrentProfile));
  const updateProfile = useSoulmapStore((s) => s.updateProfile);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(getStoredCount);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate messages from saved profile history (per profile; clears when switching)
  useEffect(() => {
    const saved = currentProfile?.oracleMessages;
    setMessages(Array.isArray(saved) ? (saved as Message[]) : []);
  }, [currentProfile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const chartContext = baziChart
    ? {
        soulType: baziChart.soulType,
        elementBalance: baziChart.elementBalance,
        fourPillars: {
          year: baziChart.yearPillar,
          month: baziChart.monthPillar,
          day: baziChart.dayPillar,
          hour: baziChart.hourPillar,
        },
        dayMasterStrength: baziChart.dayMasterStrength,
        favorableElements: baziChart.favorableElements,
        luckPillars: baziChart.luckPillars,
      }
    : null;

  const lifeContext = userProfile
    ? {
        occupation: userProfile.occupation,
        relationshipStatus: userProfile.relationshipStatus,
        currentConcern: userProfile.currentConcern,
      }
    : null;

  const canSend = messageCount < MAX_FREE_MESSAGES && input.trim();

  const sendMessage = async (text: string) => {
    if (!text.trim() || messageCount >= MAX_FREE_MESSAGES) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setMessageCount((c) => {
      const next = c + 1;
      setStoredCount(next);
      return next;
    });
    setLoading(true);

    try {
      const res = await fetch("/api/oracle/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          chartContext: chartContext ? { ...chartContext, lifeContext } : null,
          conversationHistory: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const assistantMsg: Message = { role: "assistant", content: data.reply };
      const nextMessages = [...messages, userMsg, assistantMsg];
      setMessages(nextMessages);
      if (currentProfile?.id) updateProfile(currentProfile.id, { oracleMessages: nextMessages });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage(input);
    }
  };

  if (!baziChart) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--page-bg)] px-6">
        <p className="text-[var(--secondary)]">
          Complete onboarding to get your Blueprint first. The Oracle uses your
          chart for personalized guidance.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-[var(--page-bg)] px-6 pb-24"
      style={{ height: "calc(100dvh - 9rem)", minHeight: "400px" }}
    >
      <h2 className="section-header shrink-0 text-[var(--primary)]">Life Oracle</h2>
      <p className="mt-1 shrink-0 font-mono text-sm text-[var(--secondary)]">
        Ask questions grounded in your chart and classical wisdom. {MAX_FREE_MESSAGES - messageCount} messages left (total).
      </p>

      <div className="mt-4 flex shrink-0 flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={loading || messageCount >= MAX_FREE_MESSAGES}
            className="border border-[var(--border)] bg-transparent px-3 py-2 text-left text-xs text-[var(--primary)] transition-colors duration-200 hover:bg-[var(--primary)] hover:text-[var(--page-bg)] disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && !loading && (
            <p className="text-center text-sm text-[var(--tertiary)]">
              Send a message or tap a suggestion above.
            </p>
          )}
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] border border-[var(--border)] bg-[var(--interactive-surface)] px-4 py-3 ${
                  m.role === "user"
                    ? ""
                    : "border-l-4 border-l-[var(--terracotta)] p-8"
                }`}
              >
                <div className="max-w-[68ch] whitespace-pre-wrap break-words text-[1.0625rem] leading-[1.8] text-[var(--primary)]">
                  {m.role === "assistant"
                    ? renderMarkdownInline(m.content)
                    : m.content}
                </div>
                {m.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => {
                      const userMsg = messages[i - 1];
                      const q = userMsg?.role === "user" ? userMsg.content : "Question";
                      addOracleBookmark(q, m.content);
                      setBookmarkedIds((prev) => new Set(prev).add(i));
                    }}
                    disabled={bookmarkedIds.has(i)}
                    className="mt-2 text-xs text-[var(--stone)] hover:underline disabled:opacity-60"
                  >
                    {bookmarkedIds.has(i) ? "✓ Saved to Wisdom Vault" : "Save to Wisdom Vault"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="border border-[var(--border)] bg-[var(--interactive-surface)] px-4 py-3">
                <span className="text-[var(--secondary)]">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p className="mt-2 shrink-0 text-sm text-red-400">{error}</p>
      )}

      {messageCount >= MAX_FREE_MESSAGES ? (
        <p className="mt-4 shrink-0 text-center text-sm text-[var(--secondary)]">
          You&apos;ve used your {MAX_FREE_MESSAGES} free messages. More coming in Phase 2!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your life..."
              disabled={loading}
              rows={2}
              className="min-h-[2.75rem] max-h-32 flex-1 resize-none overflow-y-auto border border-[var(--border)] bg-[var(--interactive-surface)] px-4 py-3 text-[var(--primary)] placeholder-[var(--tertiary)] focus:border-[var(--psychic-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--psychic-purple)] focus:ring-offset-2 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canSend || loading}
              className="shrink-0 bg-[var(--primary)] px-6 py-3 font-medium text-[var(--page-bg)] transition-colors duration-200 hover:bg-[var(--terracotta)] disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      )}

      <p className="mt-3 shrink-0 text-center text-xs uppercase tracking-wider text-[var(--secondary)]">
        For reflection, not prediction. Use your free will.
      </p>
    </div>
  );
}
