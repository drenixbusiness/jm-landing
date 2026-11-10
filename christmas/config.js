// When is the Christmas / New Year version of the site shown?
//
//   1. URL override (preview any day):   ?theme=christmas   or   ?theme=default
//      The choice is remembered for the browser session, so client-side navigation keeps it.
//   2. Build/env override:               NEXT_PUBLIC_THEME=christmas | default
//   3. Otherwise by date:                December 1 → January 14 (local time of the visitor).

export const THEME_KEY = 'jm-theme';
export const SEASON = { start: { month: 12, day: 1 }, end: { month: 1, day: 14 } };

export function inSeason(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  const { start, end } = SEASON;
  return (m === start.month && d >= start.day) || (m === end.month && d <= end.day);
}

// Client only (reads location / sessionStorage).
export function isChristmas() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search).get('theme');
  try {
    if (q === 'christmas' || q === 'default') sessionStorage.setItem(THEME_KEY, q);
    const saved = sessionStorage.getItem(THEME_KEY);
    if (saved) return saved === 'christmas';
  } catch { /* storage blocked — fall through */ }
  const env = process.env.NEXT_PUBLIC_THEME;
  if (env === 'christmas') return true;
  if (env === 'default') return false;
  return inSeason();
}
