import type { BadgeRole, BadgeStyle } from "@/components/BadgeCanvas";

export interface SavedProfile {
  name: string;
  role: BadgeRole;
  track: string;
  photoDataUrl: string | null;
  style: BadgeStyle;
  overlayEnabled: boolean;
}

const PROFILE_KEY = "hng-badge-profile";

export function saveProfile(profile: SavedProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadProfile(): SavedProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProfile;
  } catch {
    return null;
  }
}
