import { EMAIL } from '@/lib/site';

export const metadata = { title: 'Terms and Conditions', description: 'Cookie policy and SMS messaging terms for Joshua Meuzelaar LLC.' };

export default function Terms() {
  return (
    <div className="solid-page">
      <section className="section">
        <div className="container legal">
          <p className="eyebrow">Legal</p>
          <h1>Terms and Conditions</h1>
          <p>This Cookie Policy explains how JOSHUA MEUZELAAR LLC uses cookies and similar tracking technologies to recognize, collect, and safeguard information when you visit our website.</p>

          <h2>1. What Are Cookies?</h2>
          <p>Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, improve performance, and provide reporting information.</p>
          <p>Cookies set by the website owner (in this case, JOSHUA MEUZELAAR LLC) are called &quot;first-party cookies&quot;. Cookies set by parties other than the website owner are called &quot;third-party cookies&quot;. Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., analytics).</p>

          <h2>2. Why We Use Cookies</h2>
          <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as &quot;essential&quot; or &quot;strictly necessary&quot; cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our website.</p>

          <h2>3. Types of Cookies We Use</h2>
          <h3>3.1 Essential Website Cookies</h3>
          <p>These cookies are strictly necessary to provide you with services available through our website and to use some of its features. Because these cookies are strictly necessary to deliver the website to you, you cannot refuse them without impacting how our website functions.</p>
          <h3>3.2 Performance and Analytics Cookies</h3>
          <p>These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you in order to enhance your experience.</p>
          <h3>3.3 Functional Cookies</h3>
          <p>These cookies are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences (for example, your choice of language or region).</p>

          <h2>4. How Can I Control Cookies?</h2>
          <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by using the cookie consent banner when you first visit our site, or by adjusting the settings on your web browser to accept or refuse cookies.</p>
          <p>As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser&apos;s help menu for more information. If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website may be restricted.</p>

          <h2>5. Updates to This Policy</h2>
          <p>We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>

          <h2>6. SMS Messaging Terms</h2>
          <p>By voluntarily opting in, applicants agree to receive recruiting and application-related SMS messages from Joshua Meuzelaar LLC. Messages may include job opportunities, qualification questions, application follow-ups, and onboarding updates.</p>
          <p>Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for assistance or contact <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or +1 331-264-4343.</p>
          <p>After opting out, users may rejoin the messaging program by submitting the SMS consent form again or replying START. Consent to receive SMS messages is not a condition of employment or submitting a driver application.</p>
          <p>Carriers are not liable for delayed or undelivered messages.</p>

          <h2>7. Contact Information</h2>
          <p>If you have any questions about our use of cookies or other technologies, please email or write to us at:</p>
          <p>JOSHUA MEUZELAAR LLC<br />21W311 Ahlstrand Rd Lombard, IL 60148</p>
        </div>
      </section>
    </div>
  );
}
