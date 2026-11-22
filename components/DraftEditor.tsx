"use client";
import { useState } from "react";

export function DraftEditor({
  value, onChange, onSend, sending, sentId, disabled,
}: { value: string; onChange: (v: string) => void; onSend: (to: string) => void; sending?: boolean; sentId?: string; disabled?: boolean }) {
  const [to, setTo] = useState("+15005550006");
  const [approved, setApproved] = useState(false);
  return (
    <div className="space-y-3">
      <textarea className="field min-h-40 font-mono text-sm leading-relaxed" value={value} onChange={(e) => { onChange(e.target.value); setApproved(false); }} />
      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
        <span>{value.length} chars · {Math.ceil(value.length / 160) || 0} SMS segment(s)</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input className="field max-w-48 font-mono text-sm" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1…" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="accent-[var(--accent)]" />
          I reviewed this message
        </label>
        <button className="glow-btn px-4 py-2 text-sm" disabled={!approved || sending || disabled || !value} onClick={() => onSend(to)}>
          {sending ? "Sending…" : "Approve & send SMS"}
        </button>
      </div>
      {sentId && <div className="font-mono text-xs text-ok">✓ Sent · {sentId}</div>}
    </div>
  );
}
