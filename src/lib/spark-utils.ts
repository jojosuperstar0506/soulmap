import type { Element } from "@/types/bazi";
import { getElementForDate } from "@/content/spark-prompts";

const STREAK_KEY = "soulmap-spark-streak";
const LAST_COMPLETED_KEY = "soulmap-spark-last-completed";
const WEEK_ELEMENTS_KEY = "soulmap-spark-week-elements";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return toDateOnly(monday);
}

export function getStoredStreak(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(STREAK_KEY);
  return v ? Math.max(0, parseInt(v, 10)) : 0;
}

export function getStoredLastCompleted(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_COMPLETED_KEY);
}

export function getStoredWeekElements(): { weekStart: string; elements: Element[] } {
  if (typeof window === "undefined") return { weekStart: "", elements: [] };
  const raw = localStorage.getItem(WEEK_ELEMENTS_KEY);
  if (!raw) return { weekStart: "", elements: [] };
  try {
    const v = JSON.parse(raw);
    if (v && typeof v.weekStart === "string" && Array.isArray(v.elements)) {
      return { weekStart: v.weekStart, elements: v.elements };
    }
  } catch {
    // ignore
  }
  return { weekStart: "", elements: [] };
}

export function markSparkCompleted(date: Date): { newStreak: number; elementsThisWeek: Element[] } {
  const today = toDateOnly(date);
  const last = getStoredLastCompleted();
  let streak = getStoredStreak();

  if (last === today) {
    return { newStreak: streak, elementsThisWeek: getStoredWeekElements().elements };
  }

  const yesterday = toDateOnly(new Date(date.getTime() - 24 * 60 * 60 * 1000));
  if (last === yesterday) {
    streak += 1;
  } else if (last !== today) {
    streak = 1;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_COMPLETED_KEY, today);
    localStorage.setItem(STREAK_KEY, String(streak));
  }

  const weekStart = getWeekStart(date);
  const stored = getStoredWeekElements();
  const el = getElementForDate(date);
  let elements: Element[] = stored.elements;
  if (stored.weekStart !== weekStart) {
    elements = [el];
  } else if (!elements.includes(el)) {
    elements = [...elements, el];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(
      WEEK_ELEMENTS_KEY,
      JSON.stringify({ weekStart, elements })
    );
  }

  return { newStreak: streak, elementsThisWeek: elements };
}

export function hasCompletedToday(): boolean {
  const last = getStoredLastCompleted();
  if (!last) return false;
  return last === toDateOnly(new Date());
}
