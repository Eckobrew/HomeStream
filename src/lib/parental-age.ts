import type { KidsRating } from './parental-store';

/** Calendar dates use UTC on both server and Android; leap-day birthdays advance on March 1. */
export function ratingForBirthDate(value: unknown, now = new Date()): KidsRating | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || birth.getUTCFullYear() !== year || birth.getUTCMonth() !== month - 1 || birth.getUTCDate() !== day || birth.getTime() > now.getTime()) return null;
  let age = now.getUTCFullYear() - year;
  if (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) age--;
  return age < 4 ? 'U' : age < 12 ? 'PG' : age < 15 ? '12' : age < 18 ? '15' : '18';
}
