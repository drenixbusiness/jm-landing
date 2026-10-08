import Link from 'next/link';
import MultiStepForm from '@/components/MultiStepForm';
import Accordion from '@/components/Accordion';
import { DryVanIcon, DropHookIcon, PartialLoadIcon } from '@/components/ServiceIcons';

const SERVICE_ICONS = [DryVanIcon, PartialLoadIcon, DropHookIcon];
import { CheckIcon, InstagramIcon, FacebookIcon, MailIcon, PinIcon, PhoneIcon, Star } from '@/components/Icons';
import { ADDRESS, EMAIL, FACEBOOK, INSTAGRAM, PHONE_MAIN, SMS_CONSENT } from '@/lib/site';

export const metadata = {
  title: { absolute: 'Reliable Logistics Solutions by Joshua Meuzelaar LLC - Your Trusted Partner in Freight Transportation' },
  description:
    'Dry van hauling you can trust. Joshua Meuzelaar LLC partners with owner-operators and drivers across the US — weekly pay, 24/7 support, no touch freight.',
};

const SERVICES = [
  ['Dry Van', 'Our skilled drivers excel in providing the highly sought-after Dry Van services. This solution enables the efficient, long-distance transportation of goods, delivering them directly to warehouses or end recipients. By offering this popular option, we ensure your cargo reaches its destination safely and reliably.'],
  ['Partial loads', 'Partial loads are suitable for small and medium companies and large enterprises. This delivery service focuses on a small batch of goods being delivered across the country. Partial loads can be optimized for companies as multiple customer orders can be placed in a certain area of the vehicle, reducing your customer costs.'],
  ['Drop and hook', 'Our drop and hook service allows businesses to efficiently exchange cargo-loaded trailers. We provide specialized trailers tailored to your location and load requirements, ensuring safe handling. Our experienced drivers are carefully selected to match your specific needs, guaranteeing reliable and secure transportation throughout the process.'],
];

const STD = ['Our owner operators earn 88% of gross', 'Direct deposit every Friday', 'Get in touch to discuss', 'No Touch Freight', '24/7 Support'];
const PLANS = [
  { name: 'Work in House', desc: 'Discover how you can enjoy a fulfilling career with Joshua Meuzelaar!', price: '$1000-$10,000', per: '/Month', items: STD, cta: 'Select', href: '/jobs' },
  { name: 'Owner Operator', desc: 'Are you looking for the best company to earn best salary? Joshua Meuzelaar is perfect option.', price: '$8000-$12,000', per: '/Week', items: STD, cta: 'Select', href: '/owner-operators', hot: true },
  { name: 'Partner', desc: 'Be partner of Joshua Meuzelaar and earn even in distance.', price: '$500 - $25,000', per: '/Month', items: ['Special Programs', 'Open to new ideas', '24/7 Support', 'Financing', 'Award programs'], cta: 'Apply now', href: '/jobs' },
];

const REVIEWS = [
  ['Exceptional experience with Joshua Meuzelaar. They exceeded expectations in every way.', 'Adebowale Adegoke', '/images/avatar-adebowale.webp'],
  ['Impeccable service that goes the extra mile. Joshua Meuzelaar is my go-to for secure and timely shipping. Truly 5-star', 'Andre Barrow', '/images/avatar-andre.webp'],
  ['Reliability at its finest. They pay on time Outstanding dispatch service. A definite 5-star choice!', 'Billy Cerilus', '/images/avatar-billy.webp'],
];

const FAQ = [
  ['What type of license is required for this position?', "A valid Class A Commercial Driver's License (CDL) is required to qualify for this position."],
  ['Do I get bonus from company?', 'Yes, we give bonus depending driver ranging from fuel bonus to referal bonuses. Contact HR department for the lastest offers!'],
  ['Is there a minimum amount of experience needed to be considered for this role?', 'Yes, candidates must have at least 6 months of experience operating a Class A sleeper semi-truck to be eligible for this position.'],
  ['How often will I be paid for my work?', 'Payments will be made weekly, after the completion of each work week, which runs from Saturday to Saturday.'],
  ['What is the process for receiving my payment?', 'At the end of each work week, you will receive a statement detailing your earnings. You will need to review and confirm the accuracy of the statement before the payment can be processed.'],
  ['When will the funds be transferred after I confirm my weekly statement?', 'Once you have confirmed your weekly statement, the funds will be transferred on the following Friday.'],
  ['What should I do if I notice a discrepancy in my weekly statement?', 'If you notice any discrepancies or have questions about your weekly statement, you should contact the appropriate person or department in the company to resolve the issue before confirming the statement. This will ensure that any necessary corrections can be made before the payment is processed.'],
];

const consent = { name: 'smsConsent', type: 'check', required: true, text: SMS_CONSENT, error: 'You must agree before submitting.' };

export default function Home() {
  return (
    <>
      <section id="home-top" className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow chip-dark">JOSHUA MEUZELAAR LLC · DRY VAN</p>
            <h1>
              Delivering excellence through every mile, is the trusted name in <span className="hl">dry van hauling.</span>
            </h1>
            <p className="lead">
              Our commitment to safety, reliability, and building strong partnerships with owner-operators sets us apart.
            </p>
            <div className="btn-row" style={{ marginTop: 28 }}>
              <Link href="/owner-operators" className="btn btn-primary">Owner Operator Program</Link>
              <a href={PHONE_MAIN.tel} className="btn btn-secondary"><PhoneIcon />{PHONE_MAIN.label}</a>
            </div>
          </div>
          <div className="glass panel hero-form">
            <h2>Join today - apply</h2>
            <MultiStepForm
              id="home-join"
              submitLabel="Apply"
              steps={[[
                { name: 'fullName', label: 'Full name', type: 'text', required: true, autoComplete: 'name' },
                { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' },
                consent,
              ]]}
              success={{ title: 'Application for registration', text: 'Our manager will call you within 15 minutes to clarify the details. Have a good day!' }}
            />
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <div className="container">
          <div className="services" data-reveal>
            <div className="section-head services__head">
              <p className="eyebrow chip-dark">What we haul</p>
              <h2>Our Services</h2>
              <p>We provide a wide range of transportation services tailored to meet the needs of your business.</p>
            </div>
            <div className="svc-grid">
              {SERVICES.map(([t, d], i) => {
                const Icon = SERVICE_ICONS[i];
                return (
                  <article className="svc glass" key={t}>
                    <div className="svc__top">
                      <span className="svc__art"><Icon /></span>
                      <span className="plate plate--sm svc__num"><span className="plate__inner tnum">0{i + 1}</span></span>
                    </div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="section">
        <div className="container">
          <div className="section-head glass panel" data-reveal style={{ marginInline: 'auto', textAlign: 'center' }}>
            <p className="eyebrow">Plans</p>
            <h2>Pick your lane</h2>
          </div>
          <div className="plans-grid" data-reveal>
            {PLANS.map((p) => (
              <article key={p.name} className={`plan ${p.hot ? 'plan--hot' : 'glass'}`}>
                {p.hot && <span className="plan__tag">MOST POPULAR</span>}
                <h3>{p.name}</h3>
                <p className="plan__desc">{p.desc}</p>
                <div className="plan__price tnum">{p.price}<small>{p.per}</small></div>
                <ul>
                  {p.items.map((it) => <li key={it}><CheckIcon />{it}</li>)}
                </ul>
                <Link href={p.href} className={`btn ${p.hot ? 'btn-white' : 'btn-primary'}`}>{p.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="proud" className="section">
        <div className="container">
          <div className="glass panel split" data-reveal>
            <div className="photo-pair">
              <img src="/images/truck-sunset.webp" alt="Joshua Meuzelaar truck on the highway at sunset" width="1400" height="933" loading="lazy" />
              <img src="/images/truck-front.webp" alt="Joshua Meuzelaar tractor at golden hour" width="1024" height="1024" loading="lazy" />
            </div>
            <div>
              <p className="eyebrow">On time, every time</p>
              <h2>Proud to Deliver <span className="hl">Excellence Every Time</span></h2>
              <p className="lead">
                Joshua Meuzelaar understands the importance of on-time pickups and deliveries, but we know that this is only half the battle. Cost-saving solutions, real-time proof of deliveries and our ability to customize our services to fit your shipping needs separate us from the rest.
              </p>
              <Link href="/contact" className="btn btn-primary" style={{ marginTop: 18 }}>Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="section">
        <div className="container">
          <div className="glass panel" data-reveal>
            <div className="section-head">
              <p className="eyebrow">Reviews</p>
              <h2>What our drivers are saying</h2>
              <p>Our drivers continue to grow with us and prefer to work with our company because we are safe, innovative and reliable. Together, we will move the country forward.</p>
            </div>
            <div className="reviews-grid">
              {REVIEWS.map(([q, who, img]) => (
                <figure className="review" key={who} style={{ margin: 0 }}>
                  <div className="review__stars" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}</div>
                  <blockquote>{q}</blockquote>
                  <figcaption className="review__who">
                    <img src={img} alt="" width="160" height="160" loading="lazy" />
                    <span><b>{who}</b><span>Owner Operator</span></span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container">
          <div className="glass panel side-right" data-reveal style={{ maxWidth: 1100 }}>
            <div className="section-head">
              <p className="eyebrow">FAQs</p>
              <h2>Questions, answered</h2>
              <p>Feeling inquisitive? Have a read through some of our FAQs or contact our supporters for help.</p>
            </div>
            <div className="faq-grid">
              <img className="faq-img" src="/images/support-agent.webp" alt="Joshua Meuzelaar support team member on a headset" width="1400" height="933" loading="lazy" />
              <Accordion items={FAQ} />
            </div>
          </div>
        </div>
      </section>

      <section id="home-contact" className="section">
        <div className="container contact-grid" data-reveal>
          <div className="plate plate--slab contact-card">
            <div className="plate__inner">
              <p className="eyebrow" style={{ color: '#fff' }}>Contact</p>
              <a className="contact-card__phone tnum" href={PHONE_MAIN.tel}>{PHONE_MAIN.short}</a>
              <p style={{ fontWeight: 700, color: 'var(--mint-100)' }}>Any time 24/7</p>
              <ul className="contact-card__meta">
                <li><MailIcon /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
                <li><PinIcon />{ADDRESS}</li>
              </ul>
              <div className="contact-card__social">
                <a className="btn btn-white btn-sm" href={INSTAGRAM} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram</a>
                <a className="btn btn-white btn-sm" href={FACEBOOK} target="_blank" rel="noopener noreferrer"><FacebookIcon />Facebook</a>
              </div>
            </div>
          </div>
          <div className="glass panel">
            <h2 className="h3" style={{ fontSize: 'clamp(30px,3vw,40px)' }}>Call back</h2>
            <p className="muted">Please leave your phone number, and within 10 seconds, we will connect you with a manager. When you receive the call, please select the appropriate department.</p>
            <MultiStepForm
              id="home-callback"
              submitLabel="Call me back"
              steps={[[{ name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' }, consent]]}
              success={{ title: 'Calling you now', text: 'A manager will call you within seconds. When you pick up, please select the appropriate department.' }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
