"use client";
// Creator profile shared by onboarding, Find brands and Settings.
// Saved in the browser (demo has no accounts). If storage is blocked, it lives in memory for the session.
import { useEffect, useState } from "react";

export type Platform = "youtube" | "instagram" | "tiktok";

export interface Profile {
  name: string;
  niche: string;
  channels: Record<Platform, string>; // handle or URL per main platform ("" = not set)
  extraLinks: string[]; // anything else: X, Twitch, website, portfolio…
  phone: string;
  onboarded: boolean;
}

export const PLATFORMS: { id: Platform; label: string; base: string; placeholder: string }[] = [
  { id: "youtube", label: "YouTube", base: "https://youtube.com/@", placeholder: "@yourchannel" },
  { id: "instagram", label: "Instagram", base: "https://instagram.com/", placeholder: "@yourhandle" },
  { id: "tiktok", label: "TikTok", base: "https://tiktok.com/@", placeholder: "@yourhandle" },
];

const KEY = "creator-outreach.profile";
export const EMPTY_CHANNELS: Record<Platform, string> = { youtube: "", instagram: "", tiktok: "" };
export const DEFAULT_PROFILE: Profile = {
  name: "Demo Creator",
  niche: "outdoor & hiking gear",
  channels: { youtube: "@yourchannel", instagram: "@yourhandle", tiktok: "" },
  extraLinks: [],
  phone: "+15005550006",
  onboarded: false,
};

/** "@ana" / "ana" / full URL -> full URL for that platform. */
export function channelUrl(platform: Platform, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(v)) return `https://${v}`; // "youtube.com/@ana"
  const base = PLATFORMS.find((p) => p.id === platform)!.base;
  return base + v.replace(/^@/, "");
}

/** All links for pitches: main platforms first, then extras. */
export function profileLinks(p: Profile): string[] {
  const main = PLATFORMS.map((pl) => channelUrl(pl.id, p.channels[pl.id])).filter(Boolean);
  const extra = p.extraLinks.map((l) => l.trim()).filter(Boolean).map((l) => (/^https?:\/\//i.test(l) ? l : `https://${l}`));
  return [...main, ...extra];
}

let memory: Profile | null = null;

function normalize(raw: Partial<Profile> & { links?: string }): Profile {
  const p: Profile = { ...DEFAULT_PROFILE, ...raw, channels: { ...EMPTY_CHANNELS, ...(raw.channels ?? {}) }, extraLinks: raw.extraLinks ?? [] };
  // Migrate the old single "links" textarea format.
  if (!raw.channels && typeof raw.links === "string") {
    p.channels = { ...EMPTY_CHANNELS };
    p.extraLinks = [];
    for (const link of raw.links.split(/\s+/).filter(Boolean)) {
      const hit = PLATFORMS.find((pl) => link.toLowerCase().includes(`${pl.id}.com`));
      if (hit && !p.channels[hit.id]) p.channels[hit.id] = link;
      else p.extraLinks.push(link);
    }
  }
  delete (p as Partial<Profile> & { links?: string }).links;
  return p;
}

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {}
  return memory ?? DEFAULT_PROFILE;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfile(read());
    setLoaded(true);
    const sync = () => setProfile(read());
    window.addEventListener("profile-change", sync);
    return () => window.removeEventListener("profile-change", sync);
  }, []);

  const save = (p: Profile) => {
    memory = p;
    setProfile(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
    window.dispatchEvent(new Event("profile-change"));
  };

  return { profile, save, loaded };
}

// ---- Per-window onboarding ----
// sessionStorage is scoped to one tab/window: a reload keeps it, a new window starts empty,
// so onboarding opens again every time the app is opened in a new window.
const SESSION_KEY = "creator-outreach.onboarded-this-window";
let sessionMemory = false;

export function isWindowOnboarded(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return sessionMemory; }
}

export function setWindowOnboarded(value: boolean) {
  sessionMemory = value;
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}
