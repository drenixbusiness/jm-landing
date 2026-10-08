import Hud from '@/components/Hud';
import CalcSettlement from '@/components/CalcSettlement';
import PreTrip from '@/components/PreTrip';
import Mile from '@/components/Mile';
import GuideSign from '@/components/GuideSign';
import { DownloadIcon, PhoneIcon } from '@/components/Icons';
import { PHONE_OO, PHONE_OO_2, PRESENTATION_PDF, YARD_ADDRESS } from '@/lib/site';

export const metadata = {
  title: 'Owner Operator Opportunity',
  description:
    'Earn $9,000–$14,000/week as an owner-operator with Joshua Meuzelaar LLC. $2.80–$4.00 per mile, 12% dispatch, no trailer fee, no escrow. Yard in Oswego, IL.',
};

const DEDUCTIONS = [['Dispatch', '12%'], ['Insurance', '$400'], ['ELD', '$65'], ['IFTA', '$35']];
const WHY = [
  ['Non-Forced Dispatch', 'You choose your loads; we respect your decisions.'],
  ['Dedicated Dispatcher', 'Personal support from your own dispatcher.'],
  ['Pre-Booked Loads', 'Consistent work with advance planning.'],
  ['24/7 Support', 'Round-the-clock help when you need it.'],
  ['Full Transparency', 'Complete visibility into rates and ops.'],
  ['300+ Spot Brokers', 'Extensive network incl. Amazon seasonal.'],
];

export default function OwnerOperators() {
  return (
    <>
      <Hud />
      <section id="top" className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow chip-dark">OWNER-OPERATOR OPPORTUNITY · OSWEGO, IL</p>
            <h1>Owner Operator <span className="hl">Opportunity</span></h1>
            <p className="lead">
              Earn <b style={{ color: '#fff' }}>$9,000–$14,000/week</b> with transparent terms, dedicated support, and full flexibility.
            </p>
            <div className="btn-row" style={{ marginTop: 28 }}>
              <a href="#calculator" className="btn btn-primary">Estimate Your Weekly Net</a>
              <a href={PHONE_OO.tel} className="btn btn-secondary"><PhoneIcon />Call {PHONE_OO.label}</a>
            </div>
          </div>
          <div className="stat-cards">
            <div className="glass stat">
              <div className="stat__label">WEEKLY GROSS</div>
              <div className="stat__value tnum">$9,000–$14,000</div>
              <div className="stat__sub">Per week potential earnings</div>
            </div>
            <div className="glass stat">
              <div className="stat__label">PER MILE RATE</div>
              <div className="stat__value tnum">$2.80–$4.00</div>
              <div className="stat__sub">Revenue per mile</div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="container">
          <div className="glass panel side-left" data-reveal style={{ maxWidth: 680 }}>
            <div className="section-head">
              <p className="eyebrow">Pricing</p>
              <h2>Transparent Pricing</h2>
              <p>No hidden fees, no surprises. Just straightforward, honest pricing.</p>
            </div>
            <p className="eyebrow" style={{ color: 'var(--muted)' }}>WEEKLY DEDUCTIONS BREAKDOWN</p>
            <div className="lp-grid">
              {DEDUCTIONS.map(([l, v]) => (
                <div className="lp" key={l}>
                  <div className="lp__inner">
                    <span className="lp__label">{l}</span>
                    <span className="lp__value tnum">{v}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="plate fixed-bar">
              <div className="plate__inner">
                <div>
                  <h3>Fixed Deductions</h3>
                  <p>No trailer fee · No escrow required</p>
                </div>
                <div className="fixed-bar__val tnum">$500</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CalcSettlement />

      <section id="why" className="section">
        <div className="container">
          <div className="glass panel side-right" data-reveal>
            <div className="section-head">
              <p className="eyebrow">Why us</p>
              <h2>Why Choose Joshua Meuzelaar LLC</h2>
              <p>We provide everything you need to succeed on the road with unmatched support and resources.</p>
            </div>
            <ul className="why-list">
              {WHY.map(([t, d], i) => (
                <li className="why-item" key={t}>
                  <Mile n={`0${i + 1}`} />
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="requirements" className="section">
        <div className="container">
          <div className="glass panel side-left" data-reveal style={{ maxWidth: 700 }}>
            <div className="section-head">
              <p className="eyebrow">Requirements</p>
              <h2>Pre-Trip Check</h2>
              <p>Tap each driver requirement you meet. Check all five and you&apos;re ready to call.</p>
            </div>
            <PreTrip />
          </div>
        </div>
      </section>

      <section id="contact" className="section oo-contact">
        <div className="container" data-reveal>
          <p className="eyebrow chip-dark">24/7 SUPPORT</p>
          <h2>Ready to <span className="hl">Drive Success</span>?</h2>
          <p className="lead" style={{ color: 'rgba(255,255,255,.88)' }}>Join our growing family of successful owner operators.</p>
          <GuideSign tag="YARD" city="Oswego, IL" sub={YARD_ADDRESS} arrow phone={PHONE_OO} className="gsign--center" />
          <div className="btn-row btn-row--center">
            <a href={PHONE_OO.tel} className="btn btn-primary"><PhoneIcon />Call Now</a>
            <a href={PHONE_OO_2.tel} className="btn btn-secondary">Or Call {PHONE_OO_2.label}</a>
            <a href={PRESENTATION_PDF} className="btn btn-secondary" rel="noopener"><DownloadIcon />Presentation (PDF)</a>
          </div>
        </div>
      </section>

      <div className="call-bar">
        <a className="call-bar__call" href={PHONE_OO.tel}><span><PhoneIcon />Call {PHONE_OO.label}</span></a>
        <a className="call-bar__pdf" href={PRESENTATION_PDF} aria-label="Download presentation (PDF)" rel="noopener"><DownloadIcon /></a>
      </div>
    </>
  );
}
