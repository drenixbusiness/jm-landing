import Link from 'next/link';
import QuestionForm from '@/components/QuestionForm';
import NetworkMap from '@/components/NetworkMap';

export const metadata = {
  title: 'About Us',
  description: 'Founded in 2020, Joshua Meuzelaar LLC serves the logistics needs of the Midwestern and Southern United States with dry van transportation.',
};

const STORY = [
  {
    id: 'founding',
    title: 'Founding Vision',
    text: 'In 2020, JOSHUA MEUZELAAR was founded with a clear vision: to unearth and showcase the often overlooked transportation centres nestled within the Middle West and Southern regions of the United States. Recognizing the beauty and historical significance of these places, our founders embarked on a mission to share their stories with a global audience. This vision was driven by a passion for heritage preservation and a desire to inspire others to appreciate the rich of American dream.',
    imgs: [['/images/truck-flag.webp', 'Joshua Meuzelaar truck with the American flag'], ['/images/office-building.webp', 'Joshua Meuzelaar headquarters']],
  },
  {
    id: 'mission',
    title: 'Mission Statement',
    text: 'At JOSHUA MEUZELAAR, our mission is to preserve and celebrate architectural heritage through digital storytelling. We strive to illuminate the narratives behind each load, ensuring that their cultural importance is not lost to time. By fostering a deeper understanding and appreciation for trucking, we aim to spark curiosity and encourage exploration of our shared cultural heritage.',
    imgs: [['/images/dispatcher-office.webp', 'Dispatcher at work'], ['/images/truck-night.webp', 'Joshua Meuzelaar truck at night']],
  },
  {
    id: 'growth',
    title: 'Growth and Impact',
    text: 'Since our inception, we have achieved significant milestones in our journey. From humble beginnings, we have grown our community of trucking enthusiasts, engaging them through captivating content that highlights the unique features and historical contexts of each landmark. Our impact extends beyond digital platforms; we actively collaborate with truck drivers and communities to amplify their voices and preserve the stories that define our cultural identity. Through partnerships and outreach initiatives, we continue to expand our reach, connecting people worldwide to the rich trucking potential of the Middle West and Southern United States.',
    imgs: [['/images/office-floor.webp', 'Joshua Meuzelaar office team'], ['/images/truck-front.webp', 'Joshua Meuzelaar tractor']],
  },
];

// shape: wide wordmarks get a lower height, square badges a taller one, so all six read at the same visual weight.
const BROKERS = [
  ['broker-ch-robinson', 'C.H. Robinson', 'mid'],
  ['broker-ryder', 'Ryder', 'wide'],
  ['broker-knight', 'Knight Transportation', 'wide'],
  ['broker-rxo', 'RXO', 'wide'],
  ['broker-ups', 'UPS', 'square'],
  ['broker-old-dominion', 'Old Dominion Freight Line', 'square'],
];

export default function About() {
  return (
    <>
      <section id="about-top" className="hero">
        <div className="container">
          <div style={{ maxWidth: 900 }}>
            <p className="eyebrow chip-dark">EST. 2020 · MIDWEST &amp; SOUTH</p>
            <h1 style={{ fontSize: 'clamp(72px, 13vw, 200px)' }}>About Us</h1>
            <p className="lead">
              We have been pioneering the industry in US for 4 years, and delivering value products within given timeframe, every single time.
            </p>
            <Link href="/contact" className="btn btn-primary" style={{ marginTop: 18 }}>Contact Us</Link>
          </div>
        </div>
      </section>

      {STORY.map((s, i) => (
        <section id={s.id} className="section" key={s.id}>
          <div className="container">
            <div className={`glass panel story ${i % 2 ? 'story--flip' : ''}`} data-reveal>
              <div className="photo-pair">
                {s.imgs.map(([src, alt]) => <img key={src} src={src} alt={alt} width="1024" height="1024" loading="lazy" />)}
              </div>
              <div>
                <div className="story__num tnum" aria-hidden="true">0{i + 1}</div>
                <h2>{s.title}</h2>
                <p className="lead">{s.text}</p>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section id="network" className="section brand-band">
        <div className="container split" data-reveal>
          <div>
            <p className="eyebrow">Network</p>
            <h2>Globally Connected by Large Network</h2>
            <p className="lead">
              Logistic JOSHUA MEUZELAAR was established in 2020 to serve the logistics needs of the Midwestern and Southern regions of the United States. As pioneers in our field, we have swiftly expanded our operations to provide unparalleled service across these key American territories.
            </p>
            <Link href="/apply" className="btn btn-white" style={{ marginTop: 18 }}>Work with us</Link>
          </div>
          <NetworkMap />
        </div>
      </section>

      <section id="brokers" className="section">
        <div className="container">
          <div className="glass panel" data-reveal>
            <div className="section-head">
              <p className="eyebrow">Partners</p>
              <h2>We are trusted by major brokers</h2>
            </div>
            <ul className="brokers">
              {BROKERS.map(([f, name, shape]) => (
                <li key={f}><img src={`/images/${f}.webp`} alt={name} data-shape={shape} loading="lazy" /></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="about-contact" className="section">
        <div className="container">
          <QuestionForm id="about-question" />
        </div>
      </section>
    </>
  );
}
