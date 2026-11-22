"use client";
// YouTube / Instagram / TikTok fields with their icons, plus "Add another link" for anything else.
import { Plus, X } from "lucide-react";
import { PLATFORMS, type Platform } from "@/lib/profile";
import { PlatformIcon } from "./PlatformIcon";

export function ChannelsInput({
  channels, extraLinks, onChange,
}: {
  channels: Record<Platform, string>;
  extraLinks: string[];
  onChange: (channels: Record<Platform, string>, extraLinks: string[]) => void;
}) {
  const setChannel = (id: Platform, v: string) => onChange({ ...channels, [id]: v }, extraLinks);
  const setExtra = (i: number, v: string) => onChange(channels, extraLinks.map((l, j) => (j === i ? v : l)));
  const removeExtra = (i: number) => onChange(channels, extraLinks.filter((_, j) => j !== i));
  const addExtra = () => onChange(channels, [...extraLinks, ""]);

  return (
    <div className="space-y-2">
      {PLATFORMS.map((p) => (
        <label key={p.id} className="relative block">
          <span className="sr-only">{p.label}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><PlatformIcon platform={p.id} /></span>
          <input
            className="field pl-10"
            placeholder={`${p.label}  ${p.placeholder}`}
            value={channels[p.id]}
            onChange={(e) => setChannel(p.id, e.target.value)}
          />
        </label>
      ))}

      {extraLinks.map((link, i) => (
        <div key={i} className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><PlatformIcon platform="link" /></span>
          <input
            autoFocus={link === ""}
            className="field pl-10 pr-10"
            placeholder="Any other link: X, Twitch, website…"
            value={link}
            onChange={(e) => setExtra(i, e.target.value)}
            aria-label={`Extra link ${i + 1}`}
          />
          <button type="button" onClick={() => removeExtra(i)} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-subtle hover:text-foreground" aria-label="Remove link">
            <X size={15} />
          </button>
        </div>
      ))}

      <button type="button" onClick={addExtra} className="flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-accent hover:underline">
        <Plus size={15} /> Add another link
      </button>
    </div>
  );
}
