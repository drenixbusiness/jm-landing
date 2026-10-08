// Interstate-style guide sign: green plate, white inset border, legend in the road-sign font,
// and a white phone panel that sits inside the border (like a sign's attached service panel).
export default function GuideSign({ tag, city, sub, arrow = false, phone, phoneLabel = 'CALL 24/7', posts = true, className = '' }) {
  return (
    <div className={`gsign ${className}`}>
      <div className="plate plate--slab gsign__plate">
        <div className="plate__inner gsign__face">
          <div className="gsign__title">
            {tag && <span className="gsign__tag">{tag}</span>}
            <span className="gsign__city">{city}</span>
          </div>
          {sub && (
            <span className="gsign__sub">
              {String(sub).split(/\s*·\s*/).map((part, i) => (
                <span key={part}>
                  {i > 0 && <span className="gsign__sep" aria-hidden="true" />}
                  {part}
                </span>
              ))}
            </span>
          )}
          {arrow && (
            <svg className="gsign__arrow" viewBox="0 0 40 46" width="40" height="46" aria-hidden="true">
              <path d="M15.5 0h9v26h11L20 46 4.5 26h11z" fill="currentColor" />
            </svg>
          )}
          {phone && (
            <a className="gsign__phone tnum" href={phone.tel}>
              <small>{phoneLabel}</small>
              <b>{phone.label}</b>
            </a>
          )}
        </div>
      </div>
      {posts && (
        <div className="gsign__posts" aria-hidden="true">
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
