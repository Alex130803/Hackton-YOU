import { ExternalLink } from "lucide-react";

export function SourceList({ sources, title = "Sources" }: { sources: { title?: string; url: string }[]; title?: string }) {
  if (!sources.length) return null;
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted">{title}</div>
      <ol className="space-y-1.5 text-sm">
        {sources.map((s, i) => (
          <li key={s.url + i} className="flex min-w-0 items-center gap-2">
            <span className="text-xs text-muted">{i + 1}.</span>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="flex min-w-0 items-center gap-1 text-foreground hover:text-accent">
              <span className="truncate underline decoration-line underline-offset-2">{s.title ?? s.url}</span>
              <ExternalLink size={12} className="shrink-0 text-muted" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
