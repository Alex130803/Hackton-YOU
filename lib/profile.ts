"use client";
// Creator profile shared by onboarding, Find brands and Settings.
// Saved in the browser (demo has no accounts). If storage is blocked, it lives in memory for the session.
import { useEffect, useState } from "react";

export interface Profile {
  name: string;
  niche: string;
  links: string;
  phone: string;
  onboarded: boolean;
}

const KEY = "creator-outreach.profile";
export const DEFAULT_PROFILE: Profile = {
  name: "Demo Creator",
  niche: "outdoor & hiking gear",
  links: "https://youtube.com/@yourchannel\nhttps://instagram.com/yourhandle",
  phone: "+15005550006",
  onboarded: false,
};

let memory: Profile | null = null;

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
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

export const linkList = (links: string) => links.split(/\s+/).filter(Boolean);
