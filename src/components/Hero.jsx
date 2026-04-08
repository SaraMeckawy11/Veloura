import './Hero.css';

export default function Hero() {
  const handleClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" id="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Premium Digital Invitations
          </div>

          <h1>
            Your Wedding,<br />
            Beautifully <em>Digital</em>
          </h1>

          <p className="hero-description">
            Cinematic, animated wedding invitations with RSVP tracking, interactive maps, music, and guest management — all in one elegant link.
          </p>

          <div className="hero-buttons">
            <a href="#pricing" className="btn btn-primary" onClick={e => handleClick(e, '#pricing')}>
              Create My Invitation
            </a>
            <a href="#designs" className="btn btn-secondary" onClick={e => handleClick(e, '#designs')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              View Demo
            </a>
          </div>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <span>One-time payment</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </div>
              <span>Free unlimited edits</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </div>
              <span>Multi-language</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          {/* Floating elements */}
          <div className="float-element rsvp-count">
            <div className="float-count">142</div>
            <div className="float-label">Guests<br />Confirmed</div>
          </div>

          <div className="float-element music-note">
            <div className="float-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            </div>
            <span className="float-text">Now playing...</span>
          </div>

          {/* Phone Mockup */}
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="phone-notch" />
              <div className="phone-bg-image" />
              <div className="phone-invitation">
                <div className="phone-ornament">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,110,0.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </div>
                <div className="couple-names">Layla</div>
                <div className="ampersand">&amp;</div>
                <div className="couple-names">Omar</div>
                <div className="invite-text">Request the pleasure of your company</div>
                <div className="invite-date">June 28, 2026</div>
                <div className="invite-venue">The Grand Pavilion, Dubai</div>
                <div className="phone-rsvp-btn">RSVP Now</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
