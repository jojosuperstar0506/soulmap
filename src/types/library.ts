import type { Element } from "@/types/bazi";

export type Tradition =
  | "daoism"
  | "buddhism"
  | "stoicism"
  | "christianity"
  | "islam"
  | "judaism";

export type LibraryTheme =
  | "uncertainty_change"
  | "love_connection"
  | "purpose_calling"
  | "suffering_growth"
  | "stillness_peace"
  | "wealth_abundance"
  | "death_impermanence"
  | "courage_fear";

export interface SageInterpretation {
  sageName: string;
  interpretation: string;
}

export interface SacredText {
  id: string;
  tradition: Tradition;
  title: string;
  source?: string;
  originalText?: string;
  englishText: string;
  sageInterpretations?: SageInterpretation[];
  themes: LibraryTheme[];
  relatedElements: Element[];
}

/** A bookmarked Oracle Q&A saved to Wisdom Vault. */
export interface OracleBookmark {
  id: string;
  question: string;
  answer: string;
  savedAt: number;
}

