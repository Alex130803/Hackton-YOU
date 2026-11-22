// Renders the demo email screenshots (phone-sized PNGs) from lib/mocks/screenshots.json
// into doc/screenshots/, then writes each image's sha256 and byte size back into the JSON
// so the Offer check upload can recognize them. Usage: node scripts/make-sample-screenshots.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = join(ROOT, "lib/mocks/screenshots.json");
const OUT = join(ROOT, "doc/screenshots");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTH = 428; // iPhone 13 Pro Max points; @3x gives 1284x2778
const HEIGHT = 926;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const linkify = (s) => esc(s).replace(/(https?:\/\/\S+)/g, '<span class="link">$1</span>');

function html(m) {
  const paras = m.body.split("\n\n").map((p) => `<p>${linkify(p).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #fff; color: #111;
    font: 15px/1.42 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; }
  .status { height: 47px; display: flex; align-items: center; justify-content: space-between; padding: 0 30px 0 36px; font-weight: 600; font-size: 16px; }
  .icons { display: flex; gap: 6px; align-items: center; }
  .bars { display: flex; gap: 2px; align-items: flex-end; }
  .bars i { width: 3px; background: #111; border-radius: 1px; display: block; }
  .batt { width: 25px; height: 12px; border: 1.5px solid #999; border-radius: 4px; padding: 1.5px; }
  .batt b { display: block; height: 100%; width: 80%; background: #111; border-radius: 2px; }
  .nav { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; color: #0a64d8; font-size: 17px; }
  .wrap { padding: 4px 20px 0; }
  h1 { font-size: 21px; line-height: 1.25; font-weight: 700; margin: 6px 0 14px; }
  .who { display: flex; gap: 11px; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid #e5e5ea; }
  .av { width: 38px; height: 38px; border-radius: 50%; background: #8e8e93; color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 16px; flex: none; }
  .meta { flex: 1; min-width: 0; font-size: 13.5px; color: #6b6b70; }
  .meta .name { color: #111; font-size: 15.5px; font-weight: 600; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .body { padding-top: 14px; }
  .body p { margin-bottom: 11px; }
  .link { color: #0a64d8; text-decoration: underline; word-break: break-all; }
  </style></head><body>
  <div class="status"><span>9:41</span><span class="icons"><span class="bars"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i></span><span class="batt"><b></b></span></span></div>
  <div class="nav"><span>&#8249; Inbox</span><span>&#8963;&nbsp;&nbsp;&#8964;</span></div>
  <div class="wrap">
    <h1>${esc(m.subject)}</h1>
    <div class="who"><div class="av">${esc(m.fromName[0])}</div><div class="meta">
      <div class="row"><span class="name">${esc(m.fromName)}</span><span>${esc(m.time)}</span></div>
      <div>${esc(m.from)}</div><div>To: me &middot; ${esc(m.date)}</div></div></div>
    <div class="body">${paras}</div>
  </div></body></html>`;
}

const samples = JSON.parse(readFileSync(DATA, "utf8"));
mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "uv-shots-"));

for (const m of samples) {
  const page = join(tmp, `${m.id}.html`);
  const png = join(OUT, m.file);
  writeFileSync(page, html(m));
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${WIDTH},${HEIGHT}`,
    "--force-device-scale-factor=3", `--screenshot=${png}`, `file://${page}`], { stdio: "ignore" });
  const buf = readFileSync(png);
  m.sha256 = createHash("sha256").update(buf).digest("hex");
  m.bytes = buf.length;
  console.log(`[make-sample-screenshots] ${m.file} ${m.bytes} bytes sha256=${m.sha256.slice(0, 12)}…`);
}

writeFileSync(DATA, JSON.stringify(samples, null, 2) + "\n");
console.log(`[make-sample-screenshots] wrote ${samples.length} images to doc/screenshots and updated lib/mocks/screenshots.json`);
