import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/LegalPage.css';

const pages = {
  terms: {
    label: 'Terms of Service',
    title: 'Terms of Service',
    updated: 'May 6, 2026',
    sections: [
      {
        title: 'Service',
        body: 'Veloura creates personalized digital wedding invitations, RSVP experiences, and related hosted pages based on the information, photos, and preferences submitted by the customer.',
      },
      {
        title: 'Customer Content',
        body: 'You confirm that you have the right to upload and use all names, photos, music links, venue details, and other content submitted for your invitation. You are responsible for checking all invitation details before sharing the final link.',
      },
      {
        title: 'Payment',
        body: 'Veloura charges a one-time price for each invitation order. Payments are processed by Paddle, our merchant of record, and may include applicable taxes based on customer location.',
      },
      {
        title: 'Edits and Delivery',
        body: 'Orders include the invitation experience described on the pricing page and the included edit allowance shown in the product flow. Sensitive details may become limited after activation to protect shared invitation links and guest information.',
      },
      {
        title: 'Availability',
        body: 'We work to keep invitation links available and functional, but service availability may be affected by hosting providers, third-party integrations, maintenance, or events outside our control.',
      },
      {
        title: 'Contact',
        body: 'Questions about your order or these terms can be sent to veloura.invitations@gmail.com.',
      },
    ],
  },
  privacy: {
    label: 'Privacy Policy',
    title: 'Privacy Policy',
    updated: 'May 6, 2026',
    sections: [
      {
        title: 'Information We Collect',
        body: 'We collect the contact details, wedding details, invitation content, photos, RSVP responses, and technical information needed to create, deliver, secure, and support your invitation.',
      },
      {
        title: 'How We Use Information',
        body: 'We use submitted information to build invitations, manage RSVP and dashboard access, send order emails, provide support, improve the service, and meet legal or payment-processing requirements.',
      },
      {
        title: 'Payments',
        body: 'Payments are processed by Paddle. Veloura does not store full card numbers. Paddle may collect payment, tax, billing, and fraud-prevention information under its own buyer terms and privacy notices.',
      },
      {
        title: 'Sharing',
        body: 'We share data only with service providers needed to operate Veloura, such as hosting, database, email, file storage, analytics, and payment providers, or where required by law.',
      },
      {
        title: 'Retention',
        body: 'We keep order and invitation information while your invitation is active and as needed for support, security, accounting, and legal obligations. You may request deletion by contacting us.',
      },
      {
        title: 'Contact',
        body: 'Privacy questions or deletion requests can be sent to veloura.invitations@gmail.com.',
      },
    ],
  },
  refund: {
    label: 'Refund Policy',
    title: 'Refund Policy',
    updated: 'May 6, 2026',
    sections: [
      {
        title: 'Digital Product Policy',
        body: 'Veloura sells customized digital invitation services. Because work begins after order submission and the invitation can be delivered digitally, refunds are reviewed based on order status and the issue reported.',
      },
      {
        title: 'Eligible Refunds',
        body: 'A refund may be approved if payment was duplicated, checkout charged the wrong amount, or Veloura cannot deliver the purchased invitation due to a service issue within our control.',
      },
      {
        title: 'Non-Refundable Cases',
        body: 'Refunds are generally not available after the invitation has been created, activated, or shared, unless there is a verified technical issue we cannot fix within a reasonable time.',
      },
      {
        title: 'Request Window',
        body: 'Refund requests should be sent within 7 days of purchase with the order email, invitation code if available, and a short description of the issue.',
      },
      {
        title: 'Processing',
        body: 'Approved refunds are processed through Paddle. Timing depends on Paddle, the payment method, and the customer bank or card provider.',
      },
      {
        title: 'Contact',
        body: 'Send refund requests to veloura.invitations@gmail.com.',
      },
    ],
  },
};

export default function LegalPage({ type }) {
  const page = pages[type] || pages.terms;

  return (
    <>
      <Navbar />
      <main className="legal-page">
        <div className="legal-hero">
          <div className="legal-hero-glow" aria-hidden="true" />
          <div className="container legal-container">
            <Link className="legal-back" to="/">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to Veloura
            </Link>
            <p className="section-label">{page.label}</p>
            <h1>{page.title}</h1>
            <p className="legal-updated">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Last updated {page.updated}
            </p>
          </div>
        </div>

        <div className="container legal-container">
          <div className="legal-layout">
            <aside className="legal-toc" aria-label="On this page">
              <span className="legal-toc-title">On this page</span>
              <ol>
                {page.sections.map((section, i) => (
                  <li key={section.title}>
                    <a href={`#section-${i}`}>
                      <span className="legal-toc-num">{String(i + 1).padStart(2, '0')}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="legal-content">
              {page.sections.map((section, i) => (
                <section key={section.title} id={`section-${i}`} className="legal-section">
                  <span className="legal-section-num">{String(i + 1).padStart(2, '0')}</span>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </section>
              ))}

              <div className="legal-contact-card">
                <h3>Need a hand?</h3>
                <p>For anything not covered here, reach out to our team and we'll be happy to help.</p>
                <a href="mailto:veloura.invitations@gmail.com" className="legal-contact-link">
                  veloura.invitations@gmail.com
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
