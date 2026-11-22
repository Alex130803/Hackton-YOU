// OWNER: Person B
import type { TrustLevel, TrustVerdict } from "@/lib/types";
import type { WeightedSignal } from "./signals";

/** TODO(Person B): tune weights/thresholds; optionally let an LLM explain the verdict (keep sources). */
export function scoreSignals(signals: WeightedSignal[], base = 70): TrustVerdict {
  const score = Math.max(0, Math.min(100, base + signals.reduce((s, x) => s + x.weight, 0)));
  return {
    level: levelFor(score),
    score,
    signals: signals.map(({ label, detail, sourceUrl }) => ({ label, detail, sourceUrl })),
  };
}

export function levelFor(score: number): TrustLevel {
  if (score >= 75) return "green";
  if (score >= 45) return "yellow";
  return "red";
}
