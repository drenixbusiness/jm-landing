'use client';

import { useEffect, useState } from 'react';

// Live telemetry strip fed by the 3D scene ('jm-scene' events).
export default function Hud() {
  const [s, setS] = useState({ label: 'NIGHT RUN', speed: 62, odo: 412860.0 });
  useEffect(() => {
    const on = (e) => setS(e.detail);
    addEventListener('jm-scene', on);
    return () => removeEventListener('jm-scene', on);
  }, []);
  const odo = s.odo.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="hud" role="presentation">
      <div className="container">
        <div className="hud__l">
          <span><span className="hud__dot">●</span> <span className="hud__live">{s.label}</span></span>
          <span className="hud__route">I-88 W → OSWEGO, IL</span>
          <span className="hud__geo">41°41′N 88°21′W</span>
        </div>
        <div className="hud__r tnum">
          <span>SPEED <b>{s.speed}</b> MPH</span>
          <span>ODO <b>{odo}</b> MI</span>
        </div>
      </div>
    </div>
  );
}
