// Quiet decorative shapes for the onboarding sides. Filled purple at low opacity (no outlines), never interactive.
function Dots({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100">
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={14 + (i % 4) * 24} cy={14 + Math.floor(i / 4) * 24} r="3.5" fill="var(--accent)" />
      ))}
    </svg>
  );
}

export function OnboardingShapes() {
  const c = "var(--accent)";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Left side */}
      <Dots className="absolute left-12 top-32 hidden h-24 w-24 opacity-[0.12] md:block" />
      <svg className="absolute left-20 top-[52%] hidden h-20 w-20 rotate-12 opacity-[0.08] md:block" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="6" fill={c} />
      </svg>
      <svg className="absolute -bottom-10 left-[18%] hidden h-28 w-28 opacity-[0.06] lg:block" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill={c} />
      </svg>

      {/* Right side */}
      <svg className="absolute -right-10 top-32 hidden h-36 w-36 -rotate-6 opacity-[0.07] md:block" viewBox="0 0 100 100">
        <rect x="8" y="8" width="84" height="84" rx="10" fill={c} />
      </svg>
      <Dots className="absolute right-24 top-[55%] hidden h-24 w-24 opacity-[0.12] md:block" />
      <svg className="absolute -bottom-20 -right-20 h-64 w-64 opacity-[0.06]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill={c} />
      </svg>
    </div>
  );
}
