"use client";
// Creator profile shared by Discover and Settings. Browser-only storage (demo has no accounts).
import { useEffect, useState } from "react";

export interface Profile { name: string; niche: string; links: string; phone: string }

const KEY = "creator-outreach.profile";
export const DEFAULT_PROFILE: Profile = {
  name: "Demo Creator",
  niche: "outdoor & hiking gear",
  links: "https://youtube.com/@yourchannel\nhttps://instagram.com/yourhandle",
  phone: "+15005550006",
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
    } catch {}
  }, []);
  const save = (p: Profile) => {
    setProfile(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
    window.dispatchEvent(new Event("profile-change"));
  };
  useEffect(() => {
    const sync = () => { try { const raw = localStorage.getItem(KEY); if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); } catch {} };
    window.addEventListener("profile-change", sync);
    return () => window.removeEventListener("profile-change", sync);
  }, []);
  return { profile, save };
}

export const linkList = (links: string) => links.split(/\s+/).filter(Boolean);
