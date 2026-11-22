// iOS Mail message view at iPhone 13 Pro Max size (428x926 points). Same layout as the PNGs made by
// scripts/make-sample-screenshots.mjs, so the screenshot taken in the phone demo looks identical.
import type { ScreenshotSample } from "@/lib/mocks/screenshots";

const linkify = (line: string) =>
  line.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <span key={i} style={{ color: "#0a64d8", textDecoration: "underline", wordBreak: "break-all" }}>{part}</span> : <span key={i}>{part}</span>,
  );

export function MailScreen({ sample }: { sample: ScreenshotSample }) {
  return (
    <div style={{ width: 428, height: 926, overflow: "hidden", background: "#fff", color: "#111", font: '15px/1.42 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ height: 47 }} />
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", color: "#0a64d8", fontSize: 17 }}>
        <span>&#8249; Inbox</span>
        <span>&#8963;&nbsp;&nbsp;&#8964;</span>
      </div>
      <div style={{ padding: "4px 20px 0" }}>
        <h1 style={{ fontSize: 21, lineHeight: 1.25, fontWeight: 700, margin: "6px 0 14px" }}>{sample.subject}</h1>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", paddingBottom: 12, borderBottom: "1px solid #e5e5ea" }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#8e8e93", color: "#fff", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 16, flex: "none" }}>
            {sample.fromName[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#6b6b70" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "#111", fontSize: 15.5, fontWeight: 600 }}>{sample.fromName}</span>
              <span>{sample.time}</span>
            </div>
            <div>{sample.from}</div>
            <div>To: me &middot; {sample.date}</div>
          </div>
        </div>
        <div style={{ paddingTop: 14 }}>
          {sample.body.split("\n\n").map((p, i) => (
            <p key={i} style={{ marginBottom: 11 }}>
              {p.split("\n").map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {linkify(line)}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
