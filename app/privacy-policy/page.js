import { EMAIL } from '@/lib/site';

export const metadata = { title: 'Privacy Policy', description: 'How Joshua Meuzelaar LLC collects, uses, and safeguards your information.' };

export default function Privacy() {
  return (
    <div className="solid-page">
      <section className="section">
        <div className="container legal">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p>This Privacy Policy explains how JOSHUA MEUZELAAR LLC collects, uses, and safeguards your information when you use our services.</p>

          <h2>1. Information Collection</h2>
          <p>Our primary purpose for collecting information is to provide and facilitate your use of our transportation and communication services.</p>
          <h3>1.1 Account and Profile Information</h3>
          <p>When you access our services, you may provide:</p>
          <ul><li>Mobile phone number</li><li>Driver license and carrier-related credentials (if applicable)</li></ul>
          <h3>1.2 Service Usage Information</h3>
          <p>We may automatically collect:</p>
          <ul><li>Pages visited and session duration</li><li>Operational or request-level usage information</li><li>Message and communication metadata</li><li>Device and browser diagnostics</li></ul>
          <h3>1.3 Device Information</h3>
          <ul><li>Browser type and version</li><li>Operating system and device identifiers</li></ul>
          <h3>1.4 Contact Information</h3>
          <p>When applicants voluntarily provide their mobile phone number and separately opt in to SMS communications, Joshua Meuzelaar LLC may send recruiting and application-related messages. These messages may include job opportunities, qualification questions, application follow-ups, and onboarding updates.</p>
          <p>Message frequency varies. Message and data rates may apply. Users may reply STOP to opt out or HELP for assistance.</p>
          <p>Mobile information, phone numbers, and SMS opt-in consent will not be sold, rented, or shared with third parties or affiliates for marketing or promotional purposes. Information may be shared with service providers only as necessary to operate and support the messaging service, subject to confidentiality and security obligations.</p>

          <h2>2. Information Use and Sharing</h2>
          <h3>2.1 How We Use Information</h3>
          <ul><li>Provide and maintain our services</li><li>Communicate service updates and responses</li><li>Improve service quality, security, and reliability</li><li>Comply with legal and regulatory requirements</li></ul>
          <h3>2.2 Service Providers</h3>
          <p>We may share information with trusted service providers that help us operate our website and services, subject to confidentiality and security obligations.</p>
          <p>We may disclose information when required by law, subpoena, or legal process, or when necessary to protect rights, safety, and prevent unlawful activity.</p>

          <h2>3. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to understand usage patterns, maintain functionality, and improve user experience. You can manage cookies through your browser settings.</p>

          <h2>4. Your Rights and Choices</h2>
          <h3>4.1 Access and Correction</h3>
          <p>You may request access to your personal information and ask us to correct inaccurate or outdated information.</p>
          <h3>4.2 Deletion and Objection</h3>
          <p>You may request deletion of your personal information where applicable and object to specific processing activities.</p>

          <h2>5. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Updates will be posted on this page and become effective when published.</p>

          <h2>6. Contact Information</h2>
          <p>If you have any privacy-related questions, contact us at:</p>
          <p>JOSHUA MEUZELAAR LLC<br />21W311 Ahlstrand Rd Lombard, IL 60148<br /><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        </div>
      </section>
    </div>
  );
}
