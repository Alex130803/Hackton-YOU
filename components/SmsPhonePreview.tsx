// Live preview of the pitch as an SMS on the brand's phone. SMS only (no other channels).
import { ChevronLeft } from "lucide-react";

const LINK = /((?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|io|co|tv|me|app|dev|gg|link)(?:\/[^\s]*)?)/gi;

/** Show links the way phones do: underlined and tappable-looking. */
function withLinks(text: string) {
  return text.split(LINK).map((part, i) => (i % 2 === 1 ? <span key={i} className="text-accent underline">{part}</span> : part));
}

export function SmsPhonePreview({ fromName, message, caption }: { fromName: string; message: string; caption: string }) {
  const initials = fromName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const segments = Math.ceil(message.length / 160);
  return (
    <figure className="relative mx-auto w-full max-w-[300px]">
      {/* quiet purple shapes around the phone */}
      <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10">
        <span className="absolute -right-2 top-4 h-12 w-12 rotate-12 rounded-xl bg-accent opacity-[0.10]" />
        <span className="absolute right-10 top-0 h-6 w-6 rounded-lg bg-accent opacity-[0.07]" />
        <span className="absolute -left-4 top-1/2 h-9 w-9 -rotate-6 rounded-lg bg-accent opacity-[0.08]" />
        <span className="absolute bottom-2 left-8 h-14 w-14 rounded-full bg-accent opacity-[0.06]" />
        <span className="absolute -bottom-2 right-6 grid grid-cols-3 gap-1.5 opacity-[0.18]">
          {Array.from({ length: 9 }, (_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-accent" />)}
        </span>
      </div>

      <div className="overflow-hidden rounded-[44px] border-[10px] border-foreground bg-accent-soft">
        {/* status bar + header */}
        <div className="bg-accent px-5 pb-3 pt-3 text-white">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>9:41</span>
            <span className="h-6 w-24 rounded-full bg-foreground" aria-hidden />
            <span className="flex items-center gap-1" aria-hidden>
              <span className="flex items-end gap-px">{[4, 6, 8, 10].map((h) => <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />)}</span>
              <span className="ml-1 h-2.5 w-5 rounded-[3px] border border-white/80 p-px"><span className="block h-full w-3/4 rounded-[1px] bg-white" /></span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <ChevronLeft size={18} />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-semibold text-accent">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{fromName}</span>
              <span className="block text-xs text-white/75">Text message · SMS</span>
            </span>
          </div>
        </div>

        {/* conversation */}
        <div className="flex h-[clamp(200px,calc(100vh-27rem),440px)] flex-col gap-3 overflow-y-auto px-3 py-4">
          <span className="mx-auto rounded-full bg-white px-3 py-0.5 text-[11px] text-muted">Today 9:41</span>
          <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-snug text-foreground">
            {message.trim() ? withLinks(message) : <span className="text-muted">Your message shows here.</span>}
          </div>
          {message.trim() && <span className="ml-1 text-[11px] text-muted">{message.length} characters · {segments} SMS</span>}
          <div className="mt-auto mx-auto h-1 w-28 rounded-full bg-foreground/80" aria-hidden />
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
