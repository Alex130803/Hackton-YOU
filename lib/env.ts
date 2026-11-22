// Server-only env access. USE_MOCKS defaults to true so the demo never needs keys.
export const USE_MOCKS = (process.env.USE_MOCKS ?? "true").toLowerCase() !== "false";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (set it or use USE_MOCKS=true)`);
  return v;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
