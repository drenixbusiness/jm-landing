'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NAV, PHONE_MAIN } from '@/lib/site';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Expose the header height to CSS (hero min-height, sticky HUD).
  useEffect(() => {
    const el = ref.current;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header" ref={ref}>
      <div className="site-header__bar">
        <Link href="/" className="site-header__logo" aria-label="Joshua Meuzelaar LLC — Home">
          <img className="logo-full" src="/assets/jm-lockup-white.png" alt="Joshua Meuzelaar Express Trucking" width="1629" height="312" />
          <img className="logo-mark" src="/assets/jm-mark-white.png" alt="Joshua Meuzelaar" width="896" height="451" />
        </Link>
        <nav className="site-nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="site-nav__link" aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__right">
          <a className="site-header__phone" href={PHONE_MAIN.tel}>
            <small>( Any time 24/7 )</small>
            <span className="tnum">{PHONE_MAIN.label}</span>
          </a>
          <Link href="/apply" className="btn btn-white btn-sm">Driver Application</Link>
          <button
            type="button"
            className="burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div id="mobile-drawer" className="drawer" data-open={open}>
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="drawer__link" aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
          <Link href="/apply" className="drawer__link">Driver Application</Link>
          <a href={PHONE_MAIN.tel} className="drawer__link drawer__call">Call {PHONE_MAIN.label}</a>
        </nav>
      </div>
    </header>
  );
}
