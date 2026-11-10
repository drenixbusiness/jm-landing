'use client';

import { useEffect, useRef, useState } from 'react';

const COLORS = ['#ff3346', '#ffcc33', '#3fb6ff', '#5cff8a', '#ff8a2a'];
const PAD = 7; // garland distance from the logo
const STEP = 15; // px between bulbs

// Points every `step` px around a rounded rectangle (clockwise from the top-left corner).
function perimeter(w, h, r, step) {
  const segs = [];
  const arc = (cx, cy, a0) => {
    for (let i = 0; i < 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      segs.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(r, r, Math.PI);
  arc(w - r, r, -Math.PI / 2);
  arc(w - r, h - r, 0);
  arc(r, h - r, Math.PI / 2);
  segs.push(segs[0]);
  const len = [0];
  for (let i = 1; i < segs.length; i++) len.push(len[i - 1] + Math.hypot(segs[i][0] - segs[i - 1][0], segs[i][1] - segs[i - 1][1]));
  const total = len[len.length - 1];
  const n = Math.max(8, Math.round(total / step));
  const out = [];
  for (let k = 0; k < n; k++) {
    const d = (k / n) * total;
    let i = 1;
    while (len[i] < d) i++;
    const t = (d - len[i - 1]) / (len[i] - len[i - 1] || 1);
    const [x0, y0] = segs[i - 1], [x1, y1] = segs[i];
    out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
  }
  return out;
}

// String lights wrapped around the header logo + a Santa hat on the JM plate.
export default function LogoDecor() {
  const ref = useRef(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const img = [...host.querySelectorAll('img')].find((i) => i.offsetWidth > 0);
      if (img) setBox({ w: img.offsetWidth, h: img.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    host.querySelectorAll('img').forEach((i) => { ro.observe(i); i.addEventListener('load', measure); });
    return () => ro.disconnect();
  }, []);

  let garland = null;
  if (box) {
    const w = box.w + PAD * 2, h = box.h + PAD * 2;
    const pts = perimeter(w, h, 10, STEP);
    // Wire: sagging curve between neighbouring bulbs, bowing away from the logo.
    const cx = w / 2, cy = h / 2;
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
      d += ` Q${(mx + (ox / ol) * 3.5).toFixed(1)},${(my + (oy / ol) * 3.5).toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    });
    garland = (
      <svg className="xmas-garland" width={w} height={h} viewBox={`-6 -6 ${w + 12} ${h + 12}`} style={{ left: -PAD - 6, top: -PAD - 6, width: w + 12, height: h + 12 }} aria-hidden="true">
        <path d={d} fill="none" stroke="#0b3d2e" strokeWidth="1.6" strokeLinecap="round" />
        {pts.map(([x, y], i) => {
          const ang = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90; // bulbs hang outward
          return (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(0)})`}>
              <rect x="-1.4" y="-1.5" width="2.8" height="2.4" rx="0.5" fill="#20332c" />
              <ellipse
                className="xmas-bulb"
                cx="0" cy="-4.2" rx="2.3" ry="3.3"
                fill={COLORS[i % COLORS.length]}
                style={{ '--c': COLORS[i % COLORS.length], animationDelay: `${(i % 7) * -0.37}s` }}
              />
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <span ref={ref} className="xmas-logo" aria-hidden="true">
      {garland}
      <svg className="xmas-hat" viewBox="0 0 64 52" aria-hidden="true">
        <path d="M8 40 C 12 18, 30 4, 46 8 C 54 10, 58 20, 60 30 C 54 24, 48 20, 42 22 C 46 28, 50 34, 52 40 Z" fill="#d42a2a" />
        <path d="M14 36 C 22 18, 34 10, 46 12 C 40 16, 30 24, 24 38 Z" fill="#ef4444" opacity=".55" />
        <rect x="4" y="36" width="52" height="12" rx="6" fill="#f8fafc" />
        <rect x="4" y="36" width="52" height="5" rx="2.5" fill="#ffffff" />
        <circle cx="58" cy="32" r="6" fill="#f8fafc" />
        <circle cx="56.5" cy="30.5" r="2.2" fill="#ffffff" />
      </svg>
    </span>
  );
}
