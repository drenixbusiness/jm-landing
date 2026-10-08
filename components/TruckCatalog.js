'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CloseIcon, PhoneIcon, PinIcon } from './Icons';
import { PHONE_MAIN } from '@/lib/site';

const pad = (n) => String(n).padStart(2, '0');

export default function TruckCatalog({ trucks }) {
  const [model, setModel] = useState('');
  const [loc, setLoc] = useState('');
  const [box, setBox] = useState(null); // { truck, i }

  const models = useMemo(() => [...new Set(trucks.map((t) => t.model))].sort(), [trucks]);
  const locations = useMemo(() => [...new Set(trucks.map((t) => t.location))].sort(), [trucks]);
  const list = trucks.filter((t) => (!model || t.model === model) && (!loc || t.location === loc));

  return (
    <>
      <div className="card filters" role="search">
        <div className="mfield">
          <label htmlFor="f-model"><span className="mfield__label">Truck model</span></label>
          <select id="f-model" className="input" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="">All models</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="mfield">
          <label htmlFor="f-loc"><span className="mfield__label">Location</span></label>
          <select id="f-loc" className="input" value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">All locations</option>
            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="filters__count tnum" aria-live="polite">{list.length} {list.length === 1 ? 'truck' : 'trucks'}</div>
      </div>

      {list.length ? (
        <ul className="tlist">
          {list.map((t, idx) => (
            <TruckCard key={t.id} t={t} eager={idx === 0} onOpen={(i) => setBox({ truck: t, i })} />
          ))}
        </ul>
      ) : (
        <div className="card empty">
          <p>No trucks match these filters.</p>
          <button type="button" className="link-btn" onClick={() => { setModel(''); setLoc(''); }}>Clear filters</button>
        </div>
      )}

      {box && <Lightbox box={box} setBox={setBox} />}
    </>
  );
}

function TruckCard({ t, eager, onOpen }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const [failed, setFailed] = useState(false);
  const track = useRef(null);
  const n = t.photos.length;
  const detailsId = `${t.id}-details`;

  // Native scroll-snap does the swiping (smooth on every phone); we only read which slide is centred.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCur(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const go = (i) => {
    const el = track.current;
    if (!el) return;
    const k = (i + n) % n;
    el.scrollTo({ left: k * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <li className="tcard" data-open={open}>
      <header className="tcard__head">
        <div className="tcard__name">
          <h3><span className="tcard__year tnum">{t.year}</span> {t.model}</h3>
          <p className="tcard__loc"><PinIcon />{t.location}</p>
        </div>
        <div className="tcard__actions">
          {t.status && <span className="tcard__status">{t.status}</span>}
          <button type="button" className="tcard__toggle" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((v) => !v)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" /><path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            {open ? 'Hide details' : 'View details'}
          </button>
        </div>
      </header>

      <div className="tcard__stage">
        {n > 0 && !failed ? (
          <>
            <div className="tcard__track" ref={track} tabIndex={0} aria-label={`${t.year} ${t.model} photos`} aria-roledescription="carousel">
              {t.photos.map((src, i) => (
                <button type="button" className="tcard__slide" key={src} onClick={() => onOpen(i)} aria-label={`Open photo ${i + 1} of ${n} full screen`}>
                  <Image
                    src={src}
                    alt={`${t.year} ${t.model} — photo ${i + 1} of ${n}`}
                    fill
                    sizes="(max-width: 1180px) 100vw, 1180px"
                    quality={90}
                    priority={eager && i === 0}
                    loading={eager && i === 0 ? undefined : 'lazy'}
                    onError={() => i === 0 && setFailed(true)}
                  />
                </button>
              ))}
            </div>
            <span className="tcard__counter tnum" aria-hidden="true">{pad(cur + 1)} / {pad(n)}</span>
            {n > 1 && (
              <>
                <button type="button" className="tcard__nav tcard__nav--prev" aria-label="Previous photo" onClick={() => go(cur - 1)}><ChevronLeft /></button>
                <button type="button" className="tcard__nav tcard__nav--next" aria-label="Next photo" onClick={() => go(cur + 1)}><ChevronRight /></button>
              </>
            )}
            <span className="tcard__hint" aria-hidden="true">View details to explore</span>
          </>
        ) : (
          <div className="tcard__empty">
            <img src="/assets/jm-mark-white.png" alt="" width="896" height="451" />
            <span>PHOTOS COMING SOON</span>
          </div>
        )}

        <section className="tdetails" id={detailsId} hidden={!open} aria-label={`${t.year} ${t.model} details`}>
          <button type="button" className="tdetails__close" aria-label="Close details" onClick={() => setOpen(false)}><CloseIcon /></button>
          <div className="tdetails__lead">
            <p className="eyebrow">TRUCK {t.num} / THE DETAILS</p>
            {t.pay && (
              <>
                <p className="tdetails__paylabel">Driver pay</p>
                <p className="tdetails__pay">{t.pay}</p>
              </>
            )}
            <p className="tdetails__text">Interested in this truck? Talk to recruiting about availability and next steps.</p>
            <a href={PHONE_MAIN.tel} className="btn btn-primary"><PhoneIcon />Call recruiting</a>
          </div>
          <dl className="tdetails__grid">
            <div><dt>Truck year</dt><dd className="tnum">{t.year}</dd></div>
            <div><dt>Model</dt><dd>{t.model}</dd></div>
            {t.condition && <div><dt>Condition</dt><dd>{t.condition}</dd></div>}
            <div><dt>Location</dt><dd>{t.location}</dd></div>
            {t.amenities.length > 0 && (
              <div className="tdetails__wide">
                <dt>Additional info</dt>
                <dd className="chips">{t.amenities.map((a) => <span key={a}>{a}</span>)}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      {n > 0 && !failed && (
        <footer className="tcard__foot">
          <div className="tcard__thumbs">
            {t.photos.map((src, i) => (
              <button type="button" key={src} aria-label={`Show photo ${i + 1}`} aria-current={i === cur} onClick={() => go(i)}>
                <Image src={src} alt="" fill sizes="256px" quality={90} loading="lazy" />
              </button>
            ))}
          </div>
          <p className="tcard__more"><b className="tnum">{n} photos</b><span>Explore every angle</span></p>
        </footer>
      )}
    </li>
  );
}

function Lightbox({ box, setBox }) {
  const { truck, i } = box;
  const photos = truck.photos;
  const close = useCallback(() => setBox(null), [setBox]);
  const go = useCallback((d) => setBox((b) => b && { ...b, i: (b.i + d + b.truck.photos.length) % b.truck.photos.length }), [setBox]);
  const touch = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [close, go]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${truck.year} ${truck.model} photos`}
      onClick={(e) => e.target === e.currentTarget && close()}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touch.current ?? 0);
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lightbox__top">
        <span className="tnum">{truck.year} {truck.model.toUpperCase()} · {pad(i + 1)} / {pad(photos.length)}</span>
        <button type="button" className="lightbox__close" aria-label="Close" onClick={close} autoFocus><CloseIcon /></button>
      </div>
      <div className="lightbox__stage" onClick={(e) => e.target === e.currentTarget && close()}>
        <Image key={photos[i]} src={photos[i]} alt={`${truck.year} ${truck.model} — photo ${i + 1}`} fill sizes="100vw" quality={90} style={{ objectFit: 'contain' }} />
        {photos.length > 1 && (
          <>
            <button type="button" className="tcard__nav tcard__nav--prev" aria-label="Previous photo" onClick={() => go(-1)}><ChevronLeft /></button>
            <button type="button" className="tcard__nav tcard__nav--next" aria-label="Next photo" onClick={() => go(1)}><ChevronRight /></button>
          </>
        )}
      </div>
      <div className="lightbox__thumbs">
        {photos.map((p, k) => (
          <button type="button" key={p} aria-current={k === i} aria-label={`Photo ${k + 1}`} onClick={() => setBox({ ...box, i: k })}>
            <Image src={p} alt="" fill sizes="256px" quality={90} />
          </button>
        ))}
      </div>
    </div>
  );
}
