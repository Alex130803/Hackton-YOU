"use client";
import { useState } from "react";
import { Send, Check } from "lucide-react";

export function DraftEditor({
  value, onChange, onSend, defaultTo, sending, sentId, disabled,
}: { value: string; onChange: (v: string) => void; onSend: (to: string) => void; defaultTo: string; sending?: boolean; sentId?: string; disabled?: boolean }) {
  const [to, setTo] = useState(defaultTo);
  const [approved, setApproved] = useState(false);
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Message</label>
        <textarea className="field min-h-36 leading-relaxed" value={value} onChange={(e) => { onChange(e.target.value); setApproved(false); }} />
        <div className="mt-1 hint">{value.length} characters · {Math.ceil(value.length / 160) || 0} SMS</div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Send to</label>
          <input className="field w-48" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1…" />
        </div>
        <label className="flex h-[38px] items-center gap-2 text-sm">
          <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Looks good, send it
        </label>
        <button className="btn ml-auto" disabled={!approved || sending || disabled || !value} onClick={() => onSend(to)}>
          <Send size={15} /> {sending ? "Sending…" : "Send SMS"}
        </button>
      </div>
      {sentId && <div className="flex items-center gap-2 text-sm text-ok"><Check size={16} /> Sent ({sentId})</div>}
    </div>
  );
}
