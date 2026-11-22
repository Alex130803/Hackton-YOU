// Ultraviolet mascot: a little purple slime splatted on the floor, with big eyes.
// `blink` makes the eyes blink every few seconds; `bob` adds a soft squish. Both respect reduced motion.
export function Slime({ size = 32, blink = false, bob = false, className = "" }: { size?: number; blink?: boolean; bob?: boolean; className?: string }) {
  const eye = blink ? "uv-blink" : "";
  return (
    <svg width={size} height={size * (100 / 120)} viewBox="0 0 120 100" className={className} role="img" aria-label="Ultraviolet slime">
      <g className={bob ? "uv-bob" : ""}>
        {/* splat puddle + droplets */}
        <ellipse cx="60" cy="85" rx="54" ry="11" fill="#7c3aed" />
        <circle cx="7" cy="93" r="3.2" fill="#7c3aed" />
        <circle cx="113" cy="90" r="2.6" fill="#7c3aed" />
        <circle cx="101" cy="97" r="1.8" fill="#7c3aed" />
        {/* body */}
        <path d="M20 86 C 18 52, 34 24, 60 24 C 86 24, 102 52, 100 86 Z" fill="#8b5cf6" />
        {/* little side drips */}
        <ellipse cx="24" cy="80" rx="7" ry="9" fill="#8b5cf6" />
        <ellipse cx="97" cy="78" rx="6" ry="10" fill="#8b5cf6" />
        {/* shine */}
        <ellipse cx="42" cy="40" rx="9" ry="5" fill="#fff" opacity="0.35" transform="rotate(-25 42 40)" />
        <circle cx="54" cy="33" r="2" fill="#fff" opacity="0.35" />
        {/* eyes */}
        <g className={eye}>
          <ellipse cx="47" cy="58" rx="8.5" ry="10.5" fill="#1b1030" />
          <circle cx="50" cy="54" r="3.4" fill="#fff" />
          <circle cx="44.5" cy="62" r="1.5" fill="#fff" opacity="0.8" />
        </g>
        <g className={eye}>
          <ellipse cx="73" cy="58" rx="8.5" ry="10.5" fill="#1b1030" />
          <circle cx="76" cy="54" r="3.4" fill="#fff" />
          <circle cx="70.5" cy="62" r="1.5" fill="#fff" opacity="0.8" />
        </g>
        {/* blush + smile */}
        <ellipse cx="36" cy="70" rx="5" ry="2.6" fill="#f9a8d4" opacity="0.7" />
        <ellipse cx="84" cy="70" rx="5" ry="2.6" fill="#f9a8d4" opacity="0.7" />
        <path d="M56 70 Q 60 74 64 70" fill="none" stroke="#1b1030" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
