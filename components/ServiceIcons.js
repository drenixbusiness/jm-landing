// Line illustrations for the three services (stroke = currentColor, accents in brand green).
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Wheels({ xs }) {
  return xs.map((x) => (
    <g key={x}>
      <circle cx={x} cy="47" r="5.2" {...s} />
      <circle cx={x} cy="47" r="1.6" fill="currentColor" />
    </g>
  ));
}

// Full 53' dry van behind a tractor.
export function DryVanIcon(props) {
  return (
    <svg viewBox="0 0 96 56" width="96" height="56" aria-hidden="true" {...props}>
      <rect x="4" y="12" width="56" height="30" rx="2.5" {...s} />
      <path d="M12 12v30M20 12v30M28 12v30M36 12v30M44 12v30M52 12v30" {...s} strokeWidth="1" opacity="0.35" />
      <path d="M62 42V24h12l10 9v9z" {...s} />
      <path d="M74 24v9h10" {...s} />
      <path d="M60 42h28" {...s} />
      <rect x="10" y="20" width="22" height="9" rx="1.5" fill="#1fbf8f" opacity="0.9" />
      <Wheels xs={[14, 26, 70, 82]} />
    </svg>
  );
}

// Trailer shown in section: part of the floor filled with pallets from different customers.
export function PartialLoadIcon(props) {
  return (
    <svg viewBox="0 0 96 56" width="96" height="56" aria-hidden="true" {...props}>
      <rect x="4" y="10" width="72" height="32" rx="2.5" {...s} />
      <rect x="9" y="27" width="12" height="11" rx="1" fill="#1fbf8f" />
      <rect x="23" y="27" width="12" height="11" rx="1" fill="#1fbf8f" opacity="0.75" />
      <rect x="9" y="15" width="12" height="10" rx="1" fill="#1fbf8f" opacity="0.55" />
      <rect x="37" y="27" width="12" height="11" rx="1" {...s} strokeDasharray="2.5 2.5" />
      <rect x="51" y="27" width="12" height="11" rx="1" {...s} strokeDasharray="2.5 2.5" />
      <path d="M84 16v20M80 20l4-4 4 4M80 32l4 4 4-4" {...s} opacity="0.6" />
      <Wheels xs={[14, 26, 60]} />
    </svg>
  );
}

// Tractor drops one trailer and hooks the next.
export function DropHookIcon(props) {
  return (
    <svg viewBox="0 0 96 56" width="96" height="56" aria-hidden="true" {...props}>
      <rect x="4" y="16" width="34" height="24" rx="2" {...s} />
      <path d="M8 40v6M34 40v6" {...s} opacity="0.6" />
      <rect x="54" y="16" width="34" height="24" rx="2" fill="#1fbf8f" opacity="0.18" stroke="#1fbf8f" strokeWidth="2.2" />
      <path d="M58 40v6M84 40v6" stroke="#1fbf8f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M40 22h12M48 18l4 4-4 4" stroke="#1fbf8f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M52 34H40M44 30l-4 4 4 4" {...s} />
    </svg>
  );
}
