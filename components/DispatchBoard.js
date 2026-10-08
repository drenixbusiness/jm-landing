'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, MailIcon, PhoneIcon } from './Icons';
import { EMAIL, PHONE_MAIN } from '@/lib/site';

// Contact page "dispatch board": live Lombard (Chicago) time + the three departments and how to reach each.
const fmtTime = (d) => d.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' });
const fmtDay = (d) => d.toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'short', day: 'numeric' });

const DEPARTMENTS = [
  { code: '01', name: 'Dispatch', text: 'Loads, routing and on-the-road support.', action: { label: 'Call', href: PHONE_MAIN.tel, icon: 'phone' } },
  { code: '02', name: 'Recruiting', text: 'Owner operators and company drivers.', action: { label: 'Apply', href: '/apply', icon: 'arrow', internal: true } },
  { code: '03', name: 'HR', text: 'Paperwork, payroll and onboarding.', action: { label: 'Email', href: `mailto:${EMAIL}`, icon: 'mail' } },
];

export default function DispatchBoard() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="dboard glass" aria-label="Departments">
      <div className="dboard__top">
        <span className="dboard__live"><i aria-hidden="true" />Dispatch online · 24/7</span>
        <span className="dboard__clock tnum" suppressHydrationWarning>
          <b>{now ? fmtTime(now) : ' '}</b>
          <small>{now ? `${fmtDay(now)} · Lombard, IL` : ' '}</small>
        </span>
      </div>

      <ul className="dboard__list">
        {DEPARTMENTS.map((d) => {
          const Icon = d.action.icon === 'phone' ? PhoneIcon : d.action.icon === 'mail' ? MailIcon : ArrowRight;
          const inner = (<><Icon />{d.action.label}</>);
          return (
            <li key={d.name}>
              <span className="dboard__code tnum">{d.code}</span>
              <div>
                <b>{d.name}</b>
                <span>{d.text}</span>
              </div>
              {d.action.internal
                ? <Link href={d.action.href} className="dboard__act">{inner}</Link>
                : <a href={d.action.href} className="dboard__act">{inner}</a>}
            </li>
          );
        })}
      </ul>

      <a href="#contact-form" className="btn btn-primary dboard__cta">Request a call back</a>
    </aside>
  );
}
