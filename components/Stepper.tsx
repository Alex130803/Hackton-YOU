import { Check } from "lucide-react";

/** Numbered steps joined by lines. Done steps can be clicked to go back. */
export function Stepper({ steps, current, maxReached, onGo }: { steps: string[]; current: number; maxReached: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const reachable = i <= maxReached;
        return (
          <li key={label} className="flex items-center gap-3">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onGo(i)}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2 text-sm disabled:cursor-default"
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-medium transition-colors ${
                  active ? "border-foreground bg-white text-foreground ring-2 ring-accent-soft"
                    : done ? "border-accent bg-accent text-white"
                    : "border-line bg-white text-muted"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={active ? "font-medium text-foreground" : done ? "text-foreground" : "text-muted"}>{label}</span>
            </button>
            {i < steps.length - 1 && <span aria-hidden className={`hidden h-px w-8 sm:block ${i < current ? "bg-accent" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
