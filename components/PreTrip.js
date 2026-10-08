'use client';

import { useState } from 'react';
import { CheckIcon, PhoneIcon } from './Icons';
import { PHONE_OO } from '@/lib/site';

const ITEMS = [
  'Valid Class A CDL',
  'Minimum 2 years of verifiable OTR experience',
  'Own truck in good working condition',
  'Clean MVR — no major violations in the past 3 years',
  'Pass DOT drug and alcohol screening',
];

export default function PreTrip() {
  const [on, setOn] = useState(() => ITEMS.map(() => false));
  const n = on.filter(Boolean).length;
  return (
    <div>
      <div className="pretrip__progress">
        <div className="row tnum"><span>PROGRESS</span><span>{n} / {ITEMS.length}</span></div>
        <div className="mform__bar"><span style={{ width: `${(n / ITEMS.length) * 100}%` }} /></div>
      </div>
      <div className="pretrip__list">
        {ITEMS.map((t, i) => (
          <button
            type="button"
            role="checkbox"
            aria-checked={on[i]}
            className="toggle-row"
            key={t}
            onClick={() => setOn((s) => s.map((v, j) => (j === i ? !v : v)))}
          >
            <span className="box">{on[i] && <CheckIcon width={16} height={16} />}</span>
            {t}
          </button>
        ))}
      </div>
      {n === ITEMS.length && (
        <div className="plate plate--slab cleared" role="status">
          <div className="plate__inner">
            <h3>You&apos;re cleared to roll</h3>
            <a href={PHONE_OO.tel} className="btn btn-white"><PhoneIcon />Call {PHONE_OO.label}</a>
          </div>
        </div>
      )}
    </div>
  );
}
