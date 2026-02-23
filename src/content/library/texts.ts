import type { SacredText } from "@/types/library";

/**
 * Seed library content for Phase 2.
 *
 * Notes:
 * - Keep excerpts short (readable in <2 minutes).
 * - Prefer public domain or paraphrased summaries until licensing is finalized.
 * - Add more items over time; the UI/API support 120+.
 */
export const LIBRARY_TEXTS: SacredText[] = [
  // --- DAOISM ---
  {
    id: "dao-ttc-08-water",
    tradition: "daoism",
    title: "Tao Te Ching — Chapter 8 (On Water)",
    source: "Dao De Jing (public domain/paraphrase)",
    englishText:
      "The highest goodness is like water. Water benefits all things and does not compete. It settles in places others avoid, and so it is close to the Way.",
    themes: ["stillness_peace", "purpose_calling", "uncertainty_change"],
    relatedElements: ["water", "wood"],
  },
  {
    id: "dao-ttc-16-stillness",
    tradition: "daoism",
    title: "Tao Te Ching — Chapter 16 (Returning to Stillness)",
    source: "Dao De Jing (public domain/paraphrase)",
    englishText:
      "Become utterly quiet. Things arise and return to their root. Returning to the root is stillness; stillness is returning to what is enduring.",
    themes: ["stillness_peace", "uncertainty_change", "suffering_growth"],
    relatedElements: ["water", "earth"],
  },
  {
    id: "dao-zhuangzi-flow",
    tradition: "daoism",
    title: "Zhuangzi — Flowing With Change",
    source: "Zhuangzi (public domain/paraphrase)",
    englishText:
      "When you stop forcing, life finds its natural shape. Skill becomes effortless when you move with the grain of things instead of against it.",
    themes: ["uncertainty_change", "purpose_calling", "stillness_peace"],
    relatedElements: ["water", "wood"],
  },

  // --- BUDDHISM ---
  {
    id: "bud-dham-01-mind",
    tradition: "buddhism",
    title: "Dhammapada — The Mind Leads",
    source: "Dhammapada (public domain/paraphrase)",
    englishText:
      "Mind precedes all things. If you speak or act with a troubled mind, suffering follows. If you speak or act with a clear mind, ease follows like a shadow that never leaves.",
    themes: ["stillness_peace", "suffering_growth"],
    relatedElements: ["water", "metal"],
  },
  {
    id: "bud-dham-hope",
    tradition: "buddhism",
    title: "Dhammapada — Letting Go",
    source: "Dhammapada (public domain/paraphrase)",
    englishText:
      "Release what you cling to, and you become lighter. Freedom is not in getting more, but in needing less.",
    themes: ["stillness_peace", "wealth_abundance", "death_impermanence"],
    relatedElements: ["metal", "water"],
  },
  {
    id: "bud-heart-sutra",
    tradition: "buddhism",
    title: "Heart Sutra — Form and Emptiness",
    source: "Heart Sutra (public domain/paraphrase)",
    englishText:
      "What you call 'form' is not separate from emptiness; what you call 'emptiness' is not separate from form. When you see this, fear loosens its grip.",
    themes: ["courage_fear", "stillness_peace", "death_impermanence"],
    relatedElements: ["water", "metal"],
  },

  // --- STOICISM ---
  {
    id: "stoic-ma-02-control",
    tradition: "stoicism",
    title: "Marcus Aurelius — What You Control",
    source: "Meditations (public domain/paraphrase)",
    englishText:
      "You can’t control what happens around you, but you can govern your judgments. The mind can be a calm citadel even in chaos.",
    themes: ["uncertainty_change", "stillness_peace", "courage_fear"],
    relatedElements: ["metal", "earth"],
  },
  {
    id: "stoic-ma-03-kindness",
    tradition: "stoicism",
    title: "Marcus Aurelius — Work With Others",
    source: "Meditations (public domain/paraphrase)",
    englishText:
      "People exist for one another. Meet misunderstanding with patience, and meet hardship with virtue. That is your true work.",
    themes: ["love_connection", "suffering_growth", "purpose_calling"],
    relatedElements: ["earth", "wood"],
  },
  {
    id: "stoic-epictetus-freedom",
    tradition: "stoicism",
    title: "Epictetus — The Price of Freedom",
    source: "Discourses (public domain/paraphrase)",
    englishText:
      "Freedom is earned by discipline. The moment you stop being ruled by what others think, you regain your own life.",
    themes: ["courage_fear", "purpose_calling"],
    relatedElements: ["metal", "fire"],
  },

  // --- CHRISTIANITY ---
  {
    id: "chr-psalm-23",
    tradition: "christianity",
    title: "Psalm — Guidance in the Valley",
    source: "Psalms (public domain/paraphrase)",
    englishText:
      "Even in the valley of shadow, you are not abandoned. Guidance can arrive as steadiness, not certainty.",
    themes: ["courage_fear", "stillness_peace", "suffering_growth"],
    relatedElements: ["earth", "water"],
  },
  {
    id: "chr-proverbs-path",
    tradition: "christianity",
    title: "Proverbs — A Straight Path",
    source: "Proverbs (public domain/paraphrase)",
    englishText:
      "Hold to what is true, and your steps become clearer. Wisdom is less about speed, more about direction.",
    themes: ["purpose_calling", "uncertainty_change"],
    relatedElements: ["metal", "earth"],
  },
  {
    id: "chr-sermon-worry",
    tradition: "christianity",
    title: "Sermon on the Mount — On Worry",
    source: "Gospels (public domain/paraphrase)",
    englishText:
      "Worry cannot add a single hour to your life. Attend to today with care; tomorrow will meet you when it arrives.",
    themes: ["stillness_peace", "uncertainty_change"],
    relatedElements: ["earth", "water"],
  },

  // --- ISLAM (use Rumi for public-domain-safe seed) ---
  {
    id: "isl-rumi-guesthouse",
    tradition: "islam",
    title: "Rumi — The Guest House",
    source: "Rumi (public domain/paraphrase)",
    englishText:
      "This being human is a guest house. Every morning a new arrival. Welcome each emotion as a visitor; each has come to teach you something.",
    themes: ["suffering_growth", "stillness_peace", "uncertainty_change"],
    relatedElements: ["water", "earth"],
  },
  {
    id: "isl-rumi-love",
    tradition: "islam",
    title: "Rumi — Love’s Work",
    source: "Rumi (public domain/paraphrase)",
    englishText:
      "Love is not a feeling you possess; it is a practice that reshapes you. Let it soften what is hardened, and strengthen what is weak.",
    themes: ["love_connection", "suffering_growth"],
    relatedElements: ["fire", "earth"],
  },

  // --- JUDAISM ---
  {
    id: "jud-pirkei-avot-01",
    tradition: "judaism",
    title: "Pirkei Avot — Small Steps",
    source: "Pirkei Avot (public domain/paraphrase)",
    englishText:
      "You are not required to finish the work, but neither are you free to walk away from it. Do your portion with sincerity.",
    themes: ["purpose_calling", "suffering_growth"],
    relatedElements: ["earth", "wood"],
  },
  {
    id: "jud-ecclesiastes-season",
    tradition: "judaism",
    title: "Ecclesiastes — A Season for Everything",
    source: "Ecclesiastes (public domain/paraphrase)",
    englishText:
      "There is a season for every matter. Timing isn’t control; it’s alignment. Wisdom is learning which season you’re in.",
    themes: ["uncertainty_change", "death_impermanence", "purpose_calling"],
    relatedElements: ["earth", "metal"],
  },
];

export const TRADITION_LABELS: Record<SacredText["tradition"], string> = {
  daoism: "Daoism",
  buddhism: "Buddhism",
  stoicism: "Stoicism",
  christianity: "Christianity",
  islam: "Islam",
  judaism: "Judaism",
};

export const THEME_LABELS: Record<string, string> = {
  uncertainty_change: "Uncertainty & Change",
  love_connection: "Love & Connection",
  purpose_calling: "Purpose & Calling",
  suffering_growth: "Suffering & Growth",
  stillness_peace: "Stillness & Peace",
  wealth_abundance: "Wealth & Abundance",
  death_impermanence: "Death & Impermanence",
  courage_fear: "Courage & Fear",
};

/** Short intros for each tradition — shown at top when that tradition filter is selected. */
export const TRADITION_INTROS: Record<SacredText["tradition"], string> = {
  daoism:
    "Daoism (道教) centers on the Way (道): living in harmony with nature and the natural order. Key texts like the Tao Te Ching and Zhuangzi teach wu wei (effortless action), simplicity, and flowing with change rather than resisting it. These excerpts offer stillness, clarity, and a gentle reframe of struggle.",
  buddhism:
    "Buddhist wisdom focuses on the mind, suffering, and liberation. From the Dhammapada to the Heart Sutra, these teachings point to impermanence, compassion, and seeing through the stories we tell ourselves. Here you’ll find practices for peace and perspective.",
  stoicism:
    "Stoicism is a philosophy of virtue, reason, and what we can control. Roman and Greek Stoics—Marcus Aurelius, Epictetus—emphasize inner freedom, resilience, and meeting others with patience. These passages are grounded, practical, and strengthening.",
  christianity:
    "Christian scripture and tradition offer guidance, comfort, and moral clarity. Psalms, Proverbs, and the Gospels speak to fear, purpose, and trust. These excerpts are drawn from widely known, public-domain sources and speak to the human condition with care.",
  islam:
    "Islamic wisdom, including the poetry of Rumi and the broader tradition, emphasizes love, surrender, and the inner life. These selections focus on the heart’s work: welcoming experience, softening judgment, and connecting to something greater.",
  judaism:
    "Jewish wisdom—from Pirkei Avot to Ecclesiastes—emphasizes responsibility, seasons of life, and doing your part without needing to finish the work. These texts offer perspective on purpose, time, and integrity.",
};

/** Short intros for each theme — shown at top when that theme filter is selected. */
export const THEME_INTROS: Record<string, string> = {
  uncertainty_change: "Change and uncertainty are part of life. These passages from different traditions offer perspective on flowing with the unknown and finding steadiness in transition.",
  love_connection: "Wisdom on connection, relationship, and the heart—how to give and receive, and how love shows up as practice, not only feeling.",
  purpose_calling: "Reflections on direction, meaning, and calling. How to move toward what matters without forcing, and how to do your part with sincerity.",
  suffering_growth: "Suffering and difficulty as ground for growth. These texts speak to resilience, acceptance, and the possibility of transformation through hardship.",
  stillness_peace: "Inner quiet, presence, and peace. Practices and perspectives for calming the mind and resting in what is, across traditions.",
  wealth_abundance: "Perspectives on resources, enoughness, and abundance—less about accumulation, more about relationship to what we have and need.",
  death_impermanence: "Impermanence, endings, and the bigger picture. These passages offer a wider view of time and loss, and how to live with awareness of limits.",
  courage_fear: "Facing fear, doubt, and difficulty with courage. Wisdom on standing steady, choosing response over reaction, and finding strength in uncertainty.",
};

