import MultiStepForm from '@/components/MultiStepForm';
import { CheckIcon } from '@/components/Icons';
import { PHONE_MAIN, SMS_CONSENT } from '@/lib/site';

export const metadata = {
  title: 'Driver Application',
  description: 'Apply to drive with Joshua Meuzelaar LLC in three steps: contact details, your truck, and your CDL. Weekly pay with direct deposit every Friday.',
};

const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

export default function Apply() {
  return (
    <section id="apply-top" className="hero">
      <div className="container apply-grid">
        <div>
          <p className="eyebrow chip-dark">DRIVER APPLICATION</p>
          <h1 style={{ fontSize: 'clamp(48px, 6.4vw, 96px)' }}>New Hire Employee Information</h1>
          <p className="lead">Three steps: contact details, your truck, and your CDL.</p>
          <ul className="check-list">
            <li><CheckIcon />Valid Class A Commercial Driver&apos;s License</li>
            <li><CheckIcon />6+ months Class A sleeper experience</li>
            <li><CheckIcon />Weekly pay, direct deposit every Friday</li>
          </ul>
          <div className="glass phone-card">
            <small>Questions? ( Any time 24/7 )</small>
            <a href={PHONE_MAIN.tel} className="tnum">{PHONE_MAIN.label}</a>
          </div>
        </div>
        <div className="glass form-card">
          <MultiStepForm
            id="driver-application"
            submitLabel="Submit application"
            steps={[
              [
                { name: 'name', label: 'Name:', type: 'text', required: true, autoComplete: 'name', error: 'Please enter your name.' },
                { name: 'phone', label: 'Phone:', type: 'tel', required: true, autoComplete: 'tel', error: 'Please enter your phone number.' },
                { name: 'email', label: 'Email:', type: 'email', required: true, autoComplete: 'email', error: 'Please enter a valid email address.' },
              ],
              [
                { name: 'state', label: 'State:', type: 'select', required: true, options: STATES, placeholder: 'Select your state' },
                { name: 'source', label: 'Where did you hear about us?', type: 'select', required: true, options: ['Email Newsletter', 'Indeed', 'Instagram', 'Facebook', 'Linkedin', 'Google search', 'Recommended by a friend'] },
                { name: 'hasTruck', label: 'Do you have a Semi-Truck?', type: 'choice', required: true, options: ['Yes', 'No'] },
                { name: 'truckModelYear', label: "What's the Model and Year?", type: 'text', required: true },
              ],
              [
                { name: 'cdl', label: 'Please Upload Your CDL Pictures:', type: 'file', required: true, accept: '.jpg,.jpeg,.png,.pdf', maxMB: 10, hint: 'You can upload .jpg, .png, .pdf files' },
                { name: 'smsConsent', type: 'check', required: true, text: SMS_CONSENT, error: 'You must agree before submitting.' },
              ],
            ]}
            success={{ title: 'Application Submitted', text: 'Our manager will call you within 15 minutes to clarify the details. Have a good day!' }}
          />
        </div>
      </div>
    </section>
  );
}
