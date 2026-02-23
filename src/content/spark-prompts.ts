import type { Element } from "@/types/bazi";

export interface SparkPrompt {
  reflectionPrompt: string;
  microPractice: { type: string; instructions: string; durationMinutes: number };
  element: Element;
}

/**
 * Rotating pool of Daily Spark prompts. Index by (dayOfYear % length) for consistent daily prompt.
 */
export const SPARK_PROMPTS: SparkPrompt[] = [
  {
    reflectionPrompt: "What are you holding onto that no longer serves you?",
    microPractice: {
      type: "breathwork",
      instructions: "Take 5 breaths, counting to 4 on each inhale and 4 on each exhale.",
      durationMinutes: 2,
    },
    element: "water",
  },
  {
    reflectionPrompt: "Who made you feel seen today?",
    microPractice: {
      type: "gratitude",
      instructions: "Name 3 things you're grateful for — one for body, one for mind, one for spirit.",
      durationMinutes: 2,
    },
    element: "fire",
  },
  {
    reflectionPrompt: "What would you do if you weren't afraid?",
    microPractice: {
      type: "awareness",
      instructions: "Notice 5 things you can see, 4 you can touch, 3 you can hear. Stay present.",
      durationMinutes: 2,
    },
    element: "wood",
  },
  {
    reflectionPrompt: "Where did you hold back today — and what would change if you didn't?",
    microPractice: {
      type: "journaling",
      instructions: "Write one sentence about what you want to release today.",
      durationMinutes: 2,
    },
    element: "metal",
  },
  {
    reflectionPrompt: "What small act of kindness did you receive or give?",
    microPractice: {
      type: "breathwork",
      instructions: "Breathe into your belly for 1 minute. Let each exhale soften your shoulders.",
      durationMinutes: 1,
    },
    element: "earth",
  },
  {
    reflectionPrompt: "What are you avoiding that keeps showing up?",
    microPractice: {
      type: "elemental",
      instructions: "Spend 2 minutes with water — a glass held with intention, or washing your hands slowly.",
      durationMinutes: 2,
    },
    element: "water",
  },
  {
    reflectionPrompt: "What gave you energy today? What drained you?",
    microPractice: {
      type: "gratitude",
      instructions: "List one thing that nourished you and one you're willing to let go of.",
      durationMinutes: 2,
    },
    element: "fire",
  },
  {
    reflectionPrompt: "If today had a theme, what would it be?",
    microPractice: {
      type: "awareness",
      instructions: "Close your eyes. Feel your feet on the ground. Take 3 full breaths.",
      durationMinutes: 1,
    },
    element: "earth",
  },
  {
    reflectionPrompt: "What boundary do you need to set or soften?",
    microPractice: {
      type: "journaling",
      instructions: "Write one line: 'Today I allow myself to...'",
      durationMinutes: 2,
    },
    element: "metal",
  },
  {
    reflectionPrompt: "Where are you growing without realizing it?",
    microPractice: {
      type: "breathwork",
      instructions: "Inhale for 4, hold for 4, exhale for 6. Repeat 3 times.",
      durationMinutes: 2,
    },
    element: "wood",
  },
  {
    reflectionPrompt: "What do you need to hear from yourself right now?",
    microPractice: {
      type: "elemental",
      instructions: "Step outside or open a window. Feel the air. Breathe it in for 1 minute.",
      durationMinutes: 1,
    },
    element: "wood",
  },
  {
    reflectionPrompt: "What would your future self thank you for doing today?",
    microPractice: {
      type: "gratitude",
      instructions: "Name one person, one moment, and one quality you're grateful for.",
      durationMinutes: 2,
    },
    element: "fire",
  },
  {
    reflectionPrompt: "Where did you judge yourself or someone else today?",
    microPractice: {
      type: "awareness",
      instructions: "Notice 5 things you can see, 4 you can touch, 3 you can hear.",
      durationMinutes: 2,
    },
    element: "water",
  },
  {
    reflectionPrompt: "What is one small step toward something you've been putting off?",
    microPractice: {
      type: "journaling",
      instructions: "Write one sentence: 'The one step I can take is...'",
      durationMinutes: 2,
    },
    element: "metal",
  },
  {
    reflectionPrompt: "How can you be more gentle with yourself this week?",
    microPractice: {
      type: "elemental",
      instructions: "Place a hand on your heart. Breathe there for 1 minute.",
      durationMinutes: 1,
    },
    element: "earth",
  },
];

const ELEMENT_ROTATION: Element[] = ["wood", "fire", "earth", "metal", "water"];

/** Get a stable prompt for a given date (same date = same prompt). */
export function getSparkForDate(date: Date): SparkPrompt {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const index = dayOfYear % SPARK_PROMPTS.length;
  return SPARK_PROMPTS[index];
}

/** Get the element of the day (for collector). Uses same rotation as prompts. */
export function getElementForDate(date: Date): Element {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return ELEMENT_ROTATION[dayOfYear % 5];
}
