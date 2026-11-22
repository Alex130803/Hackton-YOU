"use client";
import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * Page title. The description shows under the title, or, with `infoTip`, inside an (i) next to the title
 * (opens on hover, focus or click; Esc or a click outside closes it).
 */
export function PageHeader({ title, description, infoTip = false, children }: { title: string; description?: string; infoTip?: boolean; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          {title}
          {infoTip && description && (
            <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <button
                type="button"
                aria-label={`About ${title}`}
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-foreground"
              >
                <Info size={17} />
              </button>
              <span
                role="tooltip"
                className={`absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-6rem)] rounded-xl border border-line bg-white p-3 text-sm font-normal leading-snug tracking-normal text-foreground/80 transition duration-150 ${
                  open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                }`}
              >
                {description}
              </span>
            </span>
          )}
        </h1>
        {!infoTip && description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
