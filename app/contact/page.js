import QuestionForm from '@/components/QuestionForm';
import Mile from '@/components/Mile';
import DispatchBoard from '@/components/DispatchBoard';
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/Icons';
import { ADDRESS, EMAIL, FACEBOOK, INSTAGRAM, PHONE_MAIN } from '@/lib/site';

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;

export const metadata = {
  title: 'Contact',
  description: 'Call Joshua Meuzelaar LLC any time 24/7 at +1 331 264 4343. Dispatch, recruiting and HR in Lombard, IL.',
};

const HISTORY = [
  ['Foundation and Early Years', 'Joshua Meuzelaar was founded in 2020 with the goal of providing high-quality logistics services. Our company began as a small firm with a big vision: to transform the perception of freight and logistics by implementing innovative solutions and creating the best conditions for our clients.'],
  ['Development and Expansion', 'From the very beginning, we aimed for continuous improvement and growth. Thanks to our commitment to quality and professionalism, we quickly earned the trust of our clients and started to expand our operations. Our fleet grew with the addition of modern trucks, and our workforce increased, allowing us to cover larger areas and offer a broader range of services.'],
  ['Innovation and Technology', 'Joshua Meuzelaar has always strived to be at the forefront of technological innovation in logistics. We implemented advanced tracking systems, enabling our clients to monitor the movement of their goods in real-time. We also actively use analytical tools to optimize routes and enhance delivery efficiency.'],
  ['Team and Culture', "We take pride in our team of professionals who work with us. Each employee at Joshua Meuzelaar is part of a big family where everyone's contribution is valued and innovation is encouraged. We maintain a spirit of collaboration and mutual support, allowing us to achieve high results and provide excellent service quality."],
  ['The Future', "Our future looks bright and promising. We continue to grow and develop, exploring new opportunities and expanding our services. Joshua Meuzelaar aims to remain a leader in the logistics field by introducing new technologies and improving existing processes. We believe that our commitment to quality and innovation will help us reach new heights and meet our clients' needs."],
  ['Conclusion', 'The history of Joshua Meuzelaar is a story of growth, innovation, and success. We are grateful to our clients for their trust and to our team for their dedication. We look forward to the future with optimism and are ready for new challenges and achievements.'],
];

export default function Contact() {
  return (
    <>
      <section id="contact-top" className="hero contact-hero">
        <div className="container contact-hero__grid">
          <div className="contact-hero__main">
            <p className="eyebrow chip-dark">CONTACT · LOMBARD, IL</p>
            <h1 className="contact-hero__title">Talk to us.<br /><span className="hl">Any time 24/7.</span></h1>
            <p className="lead">Dispatch, recruiting and HR — one team in Lombard, a phone that&apos;s answered day and night.</p>

            <div className="ctiles">
              <a className="ctile ctile--call" href={PHONE_MAIN.tel}>
                <span className="ctile__icon"><PhoneIcon width={22} height={22} /></span>
                <small>Call · any time 24/7</small>
                <b className="tnum">{PHONE_MAIN.label}</b>
              </a>
              <a className="ctile glass" href={`mailto:${EMAIL}`}>
                <span className="ctile__icon"><MailIcon width={20} height={20} /></span>
                <small>Email</small>
                <b>{EMAIL}</b>
              </a>
              <a className="ctile glass" href={DIRECTIONS} target="_blank" rel="noopener noreferrer">
                <span className="ctile__icon"><PinIcon width={20} height={20} /></span>
                <small>Office · get directions</small>
                <b>{ADDRESS}</b>
              </a>
              <div className="ctile glass ctile--social">
                <small>Follow us</small>
                <div className="ctile__socials">
                  <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon width={20} height={20} />Instagram</a>
                  <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookIcon width={20} height={20} />Facebook</a>
                </div>
              </div>
            </div>
          </div>
          <DispatchBoard />
        </div>
      </section>

      <section id="history" className="section">
        <div className="container">
          <div className="glass panel" data-reveal>
            <div className="section-head">
              <p className="eyebrow">Since 2020</p>
              <h2>The History of Joshua Meuzelaar</h2>
              <p>Joshua Meuzelaar - professionals committed to providing exceptional dry van transportation services across the United States. Founded on the principles of reliability, safety, and customer satisfaction, we&apos;ve built a reputation as one of the most trusted names in the industry.</p>
            </div>
            <ol className="timeline" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {HISTORY.map(([t, d], i) => (
                <li className="card tl-card" key={t}>
                  <Mile n={i + 1} />
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="contact-form" className="section">
        <div className="container">
          <QuestionForm id="contact-question" />
        </div>
      </section>
    </>
  );
}
