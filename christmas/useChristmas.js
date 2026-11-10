'use client';

import { useEffect, useState } from 'react';
import { isChristmas } from './config';

// false on the server and the first client render (no hydration mismatch), then the real value.
export default function useChristmas() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isChristmas()), []);
  return on;
}
