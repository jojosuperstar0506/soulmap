import type { LuckPillar } from "@/types/bazi";

/**
 * Returns the Luck Pillar (大运) that contains the given year.
 */
export function getCurrentLuckPillar(
  luckPillars: LuckPillar[],
  year: number = new Date().getFullYear()
): LuckPillar | null {
  return (
    luckPillars.find(
      (lp) => year >= lp.startYear && year <= lp.endYear
    ) ?? null
  );
}
