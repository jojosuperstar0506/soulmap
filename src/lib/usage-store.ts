/**
 * In-memory usage store for Gemini token/cost tracking.
 * Logs each call and keeps a process-level aggregate for inspection.
 *
 * When you add auth: extend recordUsage to accept userId and persist
 * (e.g. to DB) so you can enforce "Oracle messages this month" or
 * "tokens used this month" per user and show usage in a billing dashboard.
 */

type TokenUsage = { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };

const COST_PER_1M_INPUT = 0.3;
const COST_PER_1M_OUTPUT = 2.5;

function costUsd(usage: TokenUsage): number {
  return (
    (usage.promptTokenCount / 1_000_000) * COST_PER_1M_INPUT +
    (usage.candidatesTokenCount / 1_000_000) * COST_PER_1M_OUTPUT
  );
}

export interface UsageSnapshot {
  route: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  at: string;
}

const byRoute: Record<string, { inputTokens: number; outputTokens: number; costUsd: number; calls: number }> = {};
let totalCostUsd = 0;

/**
 * Record a Gemini call for aggregation. Call this from API routes after each Gemini request.
 * When auth exists, add userId and persist to your DB here.
 */
export function recordUsage(route: string, usage: TokenUsage): void {
  const input = usage.promptTokenCount;
  const output = usage.candidatesTokenCount;
  const cost = costUsd(usage);
  totalCostUsd += cost;
  if (!byRoute[route]) {
    byRoute[route] = { inputTokens: 0, outputTokens: 0, costUsd: 0, calls: 0 };
  }
  const r = byRoute[route];
  r.inputTokens += input;
  r.outputTokens += output;
  r.costUsd += cost;
  r.calls += 1;
}

/**
 * Get process-level usage summary (for debugging or admin).
 * Resets after server restart; for persistent totals, persist in recordUsage when you add a backend.
 */
export function getUsageSummary(): {
  byRoute: Record<string, { inputTokens: number; outputTokens: number; costUsd: number; calls: number }>;
  totalCostUsd: number;
} {
  return { byRoute: { ...byRoute }, totalCostUsd };
}
