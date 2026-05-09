import '../styles/Contact.css';
import useReveal from '../hooks/useReveal';

export default function Contact() {
  const headerRef = useReveal();
  const infoRef = useReveal();
  const formRef = useReveal();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! We'll be in touch soon.");
  };

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

        <div className="contact-grid">
          <div className="contact-info reveal" ref={infoRef}>
            <h3>We'd love to hear from you</h3>
            <p>
              Whether you have questions about our designs, need help choosing a template,
              or are ready to create your invitation — we're here for you.
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="contact-method-text">
                  <div className="label">Email</div>
                  <div className="value">veloura.invitations@gmail.com</div>
                </div>
              </div>

              <div className="contact-method">
                <div className="contact-method-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div className="contact-method-text">
                  <div className="label">Instagram</div>
                  <div className="value">@veloura.invites</div>
                </div>
              </div>
            </div>
          </div>

          <form className="contact-form reveal" ref={formRef} onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input type="text" id="name" placeholder="Enter your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="you@example.com" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="message">Tell us about your dream invitation</label>
              <textarea id="message" placeholder="Which design caught your eye? Any special requests?" />
            </div>
            <button type="submit" className="btn btn-gold contact-submit-btn">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
