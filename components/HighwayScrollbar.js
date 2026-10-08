'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Desktop-only custom scrollbar: a vertical highway with a top-down truck as the thumb.
// The native scrollbar is hidden (html.hw-scroll); keyboard, wheel and touchpad scrolling are untouched.
const DESKTOP = '(pointer: fine) and (min-width: 1024px)';
const TRUCK_H = 58;

export default function HighwayScrollbar() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const track = useRef(null);
  const thumb = useRef(null);
  const road = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    const mq = matchMedia(DESKTOP);
    const apply = () => {
      setOn(mq.matches);
      document.documentElement.classList.toggle('hw-scroll', mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      document.documentElement.classList.remove('hw-scroll');
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let lastY = scrollY;
    let dir = 1; // 1 = driving down the page, -1 = up

    const update = () => {
      raf = 0;
      const t = track.current, th = thumb.current, rd = road.current;
      if (!t || !th) return;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const y = scrollY;
      if (Math.abs(y - lastY) > 0.5) dir = y > lastY ? 1 : -1;
      lastY = y;
      const room = t.clientHeight - TRUCK_H;
      const p = Math.min(1, Math.max(0, y / max));
      th.style.transform = `translate3d(0, ${(p * room).toFixed(1)}px, 0)`;
      th.dataset.dir = dir > 0 ? 'down' : 'up';
      // Lane dashes roll past as you scroll, like the road moving under the wheels.
      if (rd) rd.style.backgroundPositionY = `${(-y * 0.35 % 22).toFixed(1)}px`;
      t.dataset.scrollable = max > 2 ? 'true' : 'false';
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };

    update();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    const ro = new ResizeObserver(queue);
    ro.observe(document.body);
    return () => {
      removeEventListener('scroll', queue);
      removeEventListener('resize', queue);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [on, pathname]);

  if (!on) return null;

  const scrollToRatio = (ratio, smooth) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.min(1, Math.max(0, ratio)) * max, behavior: smooth && !reduce ? 'smooth' : 'instant' });
  };

  const onTrackDown = (e) => {
    if (e.target.closest('.hw-truck')) return;
    const r = track.current.getBoundingClientRect();
    scrollToRatio((e.clientY - r.top - TRUCK_H / 2) / (r.height - TRUCK_H), true);
  };

  const onThumbDown = (e) => {
    e.preventDefault();
    const r = track.current.getBoundingClientRect();
    const tr = thumb.current.getBoundingClientRect();
    drag.current = { offset: e.clientY - tr.top, top: r.top, room: r.height - TRUCK_H };
    thumb.current.setPointerCapture(e.pointerId);
    document.documentElement.classList.add('hw-dragging');
  };
  const onThumbMove = (e) => {
    const d = drag.current;
    if (!d) return;
    scrollToRatio((e.clientY - d.top - d.offset) / d.room, false);
  };
  const onThumbUp = (e) => {
    drag.current = null;
    thumb.current?.releasePointerCapture?.(e.pointerId);
    document.documentElement.classList.remove('hw-dragging');
  };

  return (
    <div className="hw-track" ref={track} onPointerDown={onTrackDown} aria-hidden="true">
      <div className="hw-road" />
      <div className="hw-lane" ref={road} />
      <div
        className="hw-truck"
        ref={thumb}
        data-dir="down"
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
      >
        <svg viewBox="0 0 16 58" width="16" height={TRUCK_H}>
          {/* Headlight beams (point in the direction of travel = bottom of the drawing). */}
          <path className="hw-beam" d="M3.2 52 L-1 58 L7 58 Z M12.8 52 L9 58 L17 58 Z" />
          {/* 53' trailer (top-down): white roof with ribs. */}
          <rect x="1.2" y="1" width="13.6" height="35" rx="1.4" fill="#f2f3f1" stroke="#c9ccc9" strokeWidth="0.6" />
          {[6, 11, 16, 21, 26, 31].map((y) => <rect key={y} x="1.8" y={y} width="12.4" height="0.6" fill="#d6d9d6" />)}
          <rect x="3" y="14" width="10" height="9" rx="1" fill="#0a7f6f" opacity="0.9" />
          <rect x="1.2" y="1" width="13.6" height="1.6" fill="#d81f2a" opacity="0.85" />
          {/* Fifth-wheel gap + tractor. */}
          <rect x="5" y="36" width="6" height="2.4" fill="#2a2e31" />
          <path d="M2 39 h12 a1.6 1.6 0 0 1 1.6 1.6 v9.6 q0 4.8 -4 6 h-7.2 q-4 -1.2 -4 -6 v-9.6 A1.6 1.6 0 0 1 2 39 Z" fill="#0e2a21" />
          <rect x="3.4" y="40.5" width="9.2" height="5.5" rx="1" fill="#183d31" />
          <rect x="3.6" y="47.2" width="8.8" height="2.8" rx="0.8" fill="#0b1013" opacity="0.85" />
          <rect x="0" y="46.6" width="1.4" height="1.6" rx="0.4" fill="#1d2326" />
          <rect x="14.6" y="46.6" width="1.4" height="1.6" rx="0.4" fill="#1d2326" />
          <rect x="2.6" y="54.6" width="2.4" height="1" rx="0.4" fill="#fff4dc" />
          <rect x="11" y="54.6" width="2.4" height="1" rx="0.4" fill="#fff4dc" />
        </svg>
      </div>
    </div>
  );
}
