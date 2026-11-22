// Quiet decorative shapes for the onboarding sides. Purple at low opacity, never interactive.
export function OnboardingShapes() {
  const c = "var(--accent)";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Left side */}
      <svg className="absolute -left-16 top-24 hidden h-64 w-64 opacity-[0.10] md:block" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke={c} strokeWidth="1.5" />
      </svg>
      <svg className="absolute left-16 top-80 hidden h-20 w-20 rotate-12 opacity-[0.08] md:block" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" rx="6" fill={c} />
      </svg>
      <svg className="absolute bottom-24 left-10 hidden h-40 w-40 opacity-[0.10] md:block" viewBox="0 0 100 100">
        <polygon points="50,8 94,88 6,88" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <svg className="absolute bottom-[-40px] left-[22%] hidden h-28 w-28 opacity-[0.06] lg:block" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" fill={c} />
      </svg>

      {/* Right side */}
      <svg className="absolute -right-10 top-32 hidden h-36 w-36 -rotate-6 opacity-[0.07] md:block" viewBox="0 0 100 100">
        <rect x="8" y="8" width="84" height="84" rx="10" fill={c} />
      </svg>
      <svg className="absolute right-24 top-[55%] hidden h-24 w-24 opacity-[0.12] md:block" viewBox="0 0 100 100">
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={14 + (i % 4) * 24} cy={14 + Math.floor(i / 4) * 24} r="3.5" fill={c} />
        ))}
      </svg>
      <svg className="absolute -bottom-24 -right-24 h-80 w-80 opacity-[0.08]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="6" />
      </svg>
    </div>
  );
}
