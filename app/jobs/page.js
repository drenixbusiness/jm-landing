import MultiStepForm from '@/components/MultiStepForm';
import { SMS_CONSENT } from '@/lib/site';

export const metadata = {
  title: 'Careers',
  description: 'Join the Joshua Meuzelaar team — dispatch, HR, recruiting, safety, fleet, ELD, accounting and IT roles. Apply online in three quick steps.',
};

const WHY = [
  ['Innovative Environment', 'We pride ourselves on being at the forefront of the logistics industry, continuously adopting new technologies and innovative solutions to improve our services.', '/images/dispatcher-office.webp'],
  ['Professional Growth', "We believe in investing in our employees. You'll have access to continuous learning and development opportunities to help you reach your full potential.", '/images/welcome-office.webp'],
  ['Team Culture', "Our team is our family. We foster a collaborative, inclusive, and supportive culture where everyone's contributions are recognized and valued.", '/images/office-floor.webp'],
  ['Competitive Benefits', 'We offer a comprehensive benefits package that includes health insurance, retirement plans, paid time off, and more.', '/images/team-boxes.webp'],
];

const POSITIONS = ['IT Specialist', 'HR Specialist', 'HR Assistant', 'Updater', 'Fleet Specialist', 'Dispatch', 'Accounting Assistant', 'Safety Specialist', 'ELD Specialist', 'Recruiter'];

export default function Jobs() {
  return (
    <>
      <section id="jobs-top" className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow chip-dark">CAREERS AT JOSHUA MEUZELAAR</p>
            <h1>Join Our <span className="hl">Dynamic Team</span></h1>
            <p className="lead">At Joshua Meuzelaar, we are always looking for talented, dedicated individuals to join our growing team.</p>
            <p className="lead">
              We offer a dynamic and supportive work environment where every team member is valued and has the opportunity to make a real impact. Whether you&apos;re an experienced professional or just starting your career, Joshua Meuzelaar is the place to grow and achieve your career goals.
            </p>
            <a href="#apply" className="btn btn-primary" style={{ marginTop: 18 }}>Apply now</a>
          </div>
          <div className="photo-pair">
            <img src="/images/driver-portrait.webp" alt="Joshua Meuzelaar team member in front of the fleet" width="1024" height="1024" />
            <img src="/images/office-building.webp" alt="Joshua Meuzelaar office and truck yard" width="1024" height="1024" />
          </div>
        </div>
      </section>

      <section id="why-work" className="section">
        <div className="container">
          <div className="glass panel" data-reveal>
            <div className="section-head">
              <p className="eyebrow">Careers</p>
              <h2>Why Work With Us?</h2>
            </div>
            <div className="work-grid">
              {WHY.map(([t, d, img]) => (
                <article className="card work-card" key={t}>
                  <img src={img} alt="" width="1400" height="933" loading="lazy" />
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="apply" className="section">
        <div className="container">
          <div className="glass panel apply-grid" data-reveal style={{ background: 'rgba(13,19,21,.92)' }}>
            <div>
              <p className="eyebrow">Open positions</p>
              <h2>Employee Application Form</h2>
              <p className="muted">Pick the role you&apos;re applying for in the form. We&apos;re hiring for:</p>
              <div className="position-chips">
                {POSITIONS.map((p) => <span key={p}>{p}</span>)}
              </div>
            </div>
            <div className="card form-card">
              <MultiStepForm
                id="jobs-application"
                submitLabel="Submit application"
                steps={[
                  [
                    { name: 'position', label: 'Applying job position', type: 'select', required: true, options: POSITIONS, placeholder: 'Select a position' },
                    { name: 'fullName', label: 'Full name', type: 'text', required: true, autoComplete: 'name' },
                    { name: 'age', label: 'Age', type: 'number', required: true },
                  ],
                  [
                    { name: 'experienceAreas', label: 'Experience', type: 'choice', required: true, max: 3, options: ['HR', 'Recruiter', 'Update', 'Dispatch', 'Safety', 'Accounting', 'Fleet', 'ELD', 'Other'], hint: 'Choose at least one (up to 3).', error: 'Choose at least one (up to 3).' },
                    { name: 'experienceLength', label: 'Experience', type: 'number', required: true, unit: { name: 'experienceUnit', options: ['Months', 'Years'] } },
                    { name: 'phone', label: 'Contact number', type: 'tel', required: true, autoComplete: 'tel' },
                  ],
                  [
                    { name: 'languages', label: 'Candidate must know basic languages: English and Russian', type: 'choice', required: true, max: 5, options: ['English', 'Russian', 'Uzbek', 'Spain', 'Other'] },
                    { name: 'shiftAgreement', label: 'Do you agree to work from 05:00 pm to 03:00 am with Tashkent time?', type: 'choice', required: true, options: ['I agree', 'I disagree'] },
                    { name: 'cv', label: 'Upload CV', type: 'file', required: true, accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png', maxMB: 10, hint: 'Upload 1 supported file. Max 10 MB.' },
                    { name: 'smsConsent', type: 'check', required: true, text: SMS_CONSENT, error: 'You must agree before submitting.' },
                  ],
                ]}
                success={{ title: 'Application Submitted', text: 'Our HR manager will contact you within 15 minutes to confirm the details. Have a great day!' }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
