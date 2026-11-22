"use client";
// One dropdown for both sorting and filtering. Sections are passed in, so Suggestions and History can share it.
import { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

export type MenuSection =
  | { kind: "sort"; title: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }
  | { kind: "filter"; title: string; options: { value: string; label: string; count?: number }[]; value: string[]; onChange: (v: string[]) => void };

export function FilterSortMenu({ sections, activeCount, onReset }: { sections: MenuSection[]; activeCount: number; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" className="btn-ghost" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <SlidersHorizontal size={15} /> Filter & sort
        {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">{activeCount}</span>}
      </button>

      <div
        role="menu"
        className={`absolute left-0 z-30 mt-2 w-64 max-w-[calc(100vw-6rem)] origin-top-left sm:left-auto sm:right-0 sm:origin-top-right rounded-xl border border-line bg-white p-2 transition duration-150 ease-out ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {sections.map((s, i) => (
          <div key={s.title} className={i > 0 ? "mt-1 border-t border-line pt-1" : ""}>
            <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted">{s.title}</div>
            {s.options.map((o) => {
              const on = s.kind === "sort" ? s.value === o.value : s.value.includes(o.value);
              const click = () => {
                if (s.kind === "sort") s.onChange(o.value);
                else s.onChange(on ? s.value.filter((v) => v !== o.value) : [...s.value, o.value]);
              };
              return (
                <button
                  key={o.value}
                  type="button"
                  role={s.kind === "sort" ? "menuitemradio" : "menuitemcheckbox"}
                  aria-checked={on}
                  onClick={click}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-subtle"
                >
                  {s.kind === "sort" ? (
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? "border-accent" : "border-line"}`}>
                      {on && <span className="h-2 w-2 rounded-full bg-accent" />}
                    </span>
                  ) : (
                    <span className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-accent bg-accent text-white" : "border-line"}`}>
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                  )}
                  <span className="flex-1">{o.label}</span>
                  {"count" in o && o.count != null && <span className="text-xs text-muted">{o.count}</span>}
                </button>
              );
            })}
          </div>
        ))}
        <div className="mt-1 flex justify-end border-t border-line px-1 pt-2">
          <button type="button" onClick={onReset} className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:underline">Reset</button>
        </div>
      </div>
    </div>
  );
}
