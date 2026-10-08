import MultiStepForm from './MultiStepForm';
import { MailIcon, PhoneIcon, PinIcon } from './Icons';
import { ADDRESS, EMAIL, PHONE_MAIN, SMS_CONSENT } from '@/lib/site';

// "Still have question?" block shared by About and Contact.
export default function QuestionForm({ id }) {
  return (
    <div className="glass panel apply-grid" data-reveal>
      <div>
        <p className="eyebrow">Support</p>
        <h2>Still have question?</h2>
        <p className="lead">Can’t find the answer you are looking for? Please chat to our friendly team.</p>
        <ul className="info-list">
          <li><PhoneIcon /><a href={PHONE_MAIN.tel}>{PHONE_MAIN.label}</a> <span className="faint">(Any time 24/7)</span></li>
          <li><MailIcon /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
          <li><PinIcon /><span className="muted">{ADDRESS}</span></li>
        </ul>
      </div>
      <div className="card form-card">
        <MultiStepForm
          id={id}
          submitLabel="Send question"
          steps={[[
            { name: 'fullName', label: 'Full name', type: 'text', required: true, autoComplete: 'name' },
            { name: 'phone', label: 'Phone', type: 'tel', required: true, autoComplete: 'tel' },
            { name: 'question', label: 'Your question', type: 'textarea', required: true },
            { name: 'smsConsent', type: 'check', required: true, text: SMS_CONSENT, error: 'You must agree before submitting.' },
          ]]}
          success={{ title: 'Thank you', text: 'Our team will get back to you shortly.' }}
        />
      </div>
    </div>
  );
}
