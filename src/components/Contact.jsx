import '../styles/Contact.css';
import useReveal from '../hooks/useReveal';

export default function Contact() {
  const headerRef = useReveal();
  const contactRef = useReveal();

  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <span className="section-label">Get in Touch</span>
          <h2 className="section-title">Let's create something beautiful</h2>
          <p className="section-subtitle">
            Ready to get started? Reach out and we'll bring your dream invitation to life.
          </p>
        </div>

        <div className="contact-panel reveal" ref={contactRef}>
          <div className="contact-methods" aria-label="Veloura contact links">
            <a className="contact-method" href="mailto:veloura.invitations@gmail.com" aria-label="Email Veloura">
              <div className="contact-method-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="contact-method-text">
                <div className="label">Email</div>
                <div className="value">veloura.invitations@gmail.com</div>
              </div>
            </a>

            <a className="contact-method" href="https://www.instagram.com/veloura.invites" target="_blank" rel="noreferrer" aria-label="Visit Veloura on Instagram">
              <div className="contact-method-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div className="contact-method-text">
                <div className="label">Instagram</div>
                <div className="value">@veloura</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
