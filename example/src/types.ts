export interface SobrietyTracker {
  id: string;
  title: string;
  category: string;
  startDate: string; // ISO string e.g. "2026-03-10T12:00:00.000Z"
  color: string;
  tag: string; // Acronym or short text like "ALC", "NIC", "AZU"
  pledge?: string;
  bestStreakDays?: number; // mejor racha previa a un reinicio
  relapseCount?: number;
}

export interface Milestone {
  days: number;
  label: string;
  badge: string;
  chipColor: string;
}

export interface TimeElapsed {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface BibleVerse {
  book: string;
  chapter: string;
  verse: string;
  reference: string;
  text: string;
}

export interface SponsorContact {
  name: string;
  role: string;
  phone: string;
}
