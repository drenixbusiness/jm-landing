'use client';

import { useEffect, useMemo, useState } from 'react';

const DISPATCH = 0.12;
const FIXED = { Insurance: 400, ELD: 65, IFTA: 35 };
const FIXED_TOTAL = 500;
const LOADS = [
  ['JM-24101', 'Joliet, IL → Dallas, TX', 0.35],
  ['JM-24102', 'Dallas, TX → Atlanta, GA', 0.29],
  ['JM-24103', 'Atlanta, GA → Columbus, OH', 0.21],
  ['JM-24104', 'Columbus, OH → Joliet, IL', 0.15],
];
const COLORS = { net: '#1fbf8f', fuel: '#5cbfa8', dispatch: '#98989b', fixed: '#5d5d60' };

const usd = (n, d = 2) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d });

function Odometer({ value }) {
  const txt = `${value < 0 ? '-' : ''}$${Math.round(Math.abs(value)).toLocaleString('en-US')}`;
  return (
    <div className="odo" aria-label={txt} role="img">
      {txt.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <span className="odo__cell" key={`${txt.length}-${i}`}>
            <span className="odo__strip" style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span className="odo__cell odo__cell--sym" key={`${txt.length}-${i}`}><span>{ch}</span></span>
        ),
      )}
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, fmt }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="range">
      <span className="range__top">
        <span className="range__label">{label}</span>
        <span className="range__val tnum">{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} style={{ '--p': `${p}%` }} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={fmt(value)} />
    </label>
  );
}

// ISO-8601 week number + Mon–Sun period of the current week.
function weekInfo(now) {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (x) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { year: d.getUTCFullYear(), week: String(week).padStart(2, '0'), period: `${f(mon)} – ${f(sun)}, ${sun.getFullYear()}` };
}

export default function CalcSettlement() {
  const [miles, setMiles] = useState(4000);
  const [rpm, setRpm] = useState(3.3);
  const [mpg, setMpg] = useState(6.5);
  const [diesel, setDiesel] = useState(3.8);
  const [afterFuel, setAfterFuel] = useState(false);
  const [wk, setWk] = useState(null);
  useEffect(() => setWk(weekInfo(new Date())), []);

  const r = useMemo(() => {
    const gross = miles * rpm;
    const dispatch = gross * DISPATCH;
    const gallons = miles / mpg;
    const fuel = afterFuel ? gallons * diesel : 0;
    const net = gross - dispatch - FIXED_TOTAL - fuel;
    return { gross, dispatch, gallons, fuel, net, ppm: net / miles };
  }, [miles, rpm, mpg, diesel, afterFuel]);

  const parts = [
    ['net', Math.max(0, r.net)],
    ['fuel', r.fuel],
    ['dispatch', r.dispatch],
    ['fixed', FIXED_TOTAL],
  ];
  const total = parts.reduce((a, [, v]) => a + v, 0) || 1;

  return (
    <>
      <section id="calculator" className="section">
        <div className="container">
          <div className="glass panel side-left" data-reveal style={{ maxWidth: 1080 }}>
            <div className="section-head">
              <p className="eyebrow">Run the numbers</p>
              <h2>Weekly Net Calculator</h2>
              <p>Set your miles, rate and fuel. Deductions are fixed: Dispatch 12%, Insurance $400, ELD $65, IFTA $35.</p>
            </div>
            <div className="calc">
              <div className="calc__controls">
                <div className="fuel-toggle" role="radiogroup" aria-label="Fuel mode" data-value={afterFuel ? 'after' : 'before'}>
                  <span className="fuel-toggle__thumb" aria-hidden="true" />
                  <button type="button" role="radio" aria-checked={!afterFuel} onClick={() => setAfterFuel(false)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" /><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.6 0-2.7.8-2.7 2s1.1 1.7 2.7 2.1 2.8.9 2.8 2.2-1.2 2.1-2.8 2.1c-1.2 0-2.2-.5-2.7-1.5M12 6.3v1.5m0 8.4v1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    Before fuel
                  </button>
                  <button type="button" role="radio" aria-checked={afterFuel} onClick={() => setAfterFuel(true)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4.5 20.5V5.5a2 2 0 012-2h6a2 2 0 012 2v15m-12 0h14M7 7.5h5m2.5 3h1.6a1.4 1.4 0 011.4 1.4v4.6a1.5 1.5 0 003 0V9.2l-2.6-2.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    After fuel
                  </button>
                </div>
                <Range label="MILES / WEEK" value={miles} min={2500} max={7000} step={100} onChange={setMiles} fmt={(v) => v.toLocaleString('en-US')} />
                <Range label="RATE PER MILE" value={rpm} min={2.8} max={4} step={0.05} onChange={setRpm} fmt={(v) => `$${v.toFixed(2)}`} />
                {afterFuel && (
                  <>
                    <Range label="TRUCK MPG" value={mpg} min={5} max={9} step={0.1} onChange={setMpg} fmt={(v) => v.toFixed(1)} />
                    <Range label="DIESEL $/GAL" value={diesel} min={3} max={8} step={0.05} onChange={setDiesel} fmt={(v) => `$${v.toFixed(2)}`} />
                  </>
                )}
              </div>
              <div className="result" aria-live="polite">
                <div className="result__label">ESTIMATED NET / WEEK · {afterFuel ? 'AFTER FUEL' : 'BEFORE FUEL'}</div>
                <Odometer value={r.net} />
                <div className="result__ppm"><b className="tnum">{usd(r.ppm)}</b> net per mile</div>
                <div className="rows tnum">
                  <div><span className="sw" style={{ background: COLORS.net }} /><span>Gross ({miles.toLocaleString('en-US')} mi × ${rpm.toFixed(2)})</span><span className="val">{usd(r.gross, 0)}</span></div>
                  <div><span className="sw" style={{ background: COLORS.dispatch }} /><span>Dispatch (12%)</span><span className="val">−{usd(r.dispatch, 0)}</span></div>
                  <div><span className="sw" style={{ background: COLORS.fixed }} /><span>Fixed deductions</span><span className="val">−$500</span></div>
                  {afterFuel && (
                    <div><span className="sw" style={{ background: COLORS.fuel }} /><span>Fuel (est. {Math.round(r.gallons).toLocaleString('en-US')} gal)</span><span className="val">−{usd(r.fuel, 0)}</span></div>
                  )}
                </div>
                <div className="stack" aria-hidden="true">
                  {parts.map(([k, v]) => <span key={k} style={{ width: `${(v / total) * 100}%`, background: COLORS[k] }} />)}
                </div>
                <p className="foot">Estimates only. Fuel usage and price vary by lane and driver.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="settlement" className="section">
        <div className="container">
          <div className="glass panel side-right" data-reveal style={{ maxWidth: 820 }}>
            <div className="section-head">
              <p className="eyebrow">Paid every week</p>
              <h2>Your Weekly Settlement</h2>
              <p>This sample statement updates with the calculator. Nothing is held back in escrow.</p>
            </div>
            <div className="stub">
              <div className="stub__head">
                <img src="/assets/jm-lockup.png" alt="Joshua Meuzelaar Express Trucking" width="1629" height="312" />
                <div className="stub__title">
                  SETTLEMENT STATEMENT
                  <small className="tnum">No. JM-{wk ? `${wk.year}-${wk.week}` : '————'}</small>
                  <small className="tnum">{wk ? wk.period : ' '}</small>
                  <span className="stub__tag">SAMPLE</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th className="col-id">LOAD</th><th>LANE</th><th className="num">MILES</th><th className="num">AMOUNT</th></tr>
                </thead>
                <tbody>
                  {LOADS.map(([id, lane, share]) => {
                    const m = Math.round(miles * share);
                    return (
                      <tr key={id}>
                        <td className="col-id">{id}</td>
                        <td>{lane}</td>
                        <td className="num">{m.toLocaleString('en-US')}</td>
                        <td className="num">{usd(miles * share * rpm)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="stub__sum tnum">
                <div><b>Gross revenue</b><b>{usd(r.gross)}</b></div>
                <div><span>Dispatch (12%)</span><span>−{usd(r.dispatch)}</span></div>
                {Object.entries(FIXED).map(([k, v]) => <div key={k}><span>{k}</span><span>−{usd(v)}</span></div>)}
                {afterFuel && <div><span>Fuel (est. {Math.round(r.gallons).toLocaleString('en-US')} gal)</span><span>−{usd(r.fuel)}</span></div>}
                <div className="stub__net"><span>Net pay</span><span>{usd(r.net)}</span></div>
              </div>
              <p className="stub__note">Illustrative lanes. Escrow withheld: $0.00 · Trailer fee: $0.00</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
