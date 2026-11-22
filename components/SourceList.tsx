export function SourceList({ sources, title = "Sources" }: { sources: { title?: string; url: string }[]; title?: string }) {
  if (!sources.length) return null;
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">{title}</div>
      <ol className="space-y-1 text-sm">
        {sources.map((s, i) => (
          <li key={s.url + i} className="flex gap-2">
            <span className="font-mono text-accent">[{i + 1}]</span>
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="truncate text-foreground/80 underline decoration-line underline-offset-2 hover:text-accent">
              {s.title ?? s.url}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
