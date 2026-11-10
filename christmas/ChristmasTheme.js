'use client';

import { useEffect } from 'react';
import useChristmas from './useChristmas';

// Flags <html data-theme="christmas"> so christmas.css (all rules scoped to it) switches on.
export default function ChristmasTheme() {
  const on = useChristmas();
  useEffect(() => {
    if (on) document.documentElement.dataset.theme = 'christmas';
    else delete document.documentElement.dataset.theme;
  }, [on]);
  return null;
}
