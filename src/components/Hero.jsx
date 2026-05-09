import { Link } from 'react-router-dom';
import '../styles/Hero.css';

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
            <Link to="/order" className="btn btn-primary" data-primary-create-cta>
              Create My Invitation
            </Link>
            <a href="#designs" className="btn btn-secondary" onClick={e => {
              e.preventDefault();
              const el = document.querySelector('#designs');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              View Designs
            </a>
          </div>

          {/* Removed hero-features: One-time payment, Free unlimited edits, Multi-language */}
        </div>

        <div className="hero-visual">
          {/* Floating elements */}
          <div className="float-element rsvp-count">
            <div className="float-count">142</div>
            <div className="float-label">Guests<br />Confirmed</div>
          </div>

          {/* <div className="float-element music-note">
            <div className="float-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            </div>
            <span className="float-text">Now playing...</span>
          </div> */}

          {/* Phone Mockup */}
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="phone-notch" />
              <div className="phone-bg-image" />
              <div className="phone-invitation">
                <div className="phone-ornament">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,110,0.6)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </div>
                <div className="invite-kicker">Together with their families</div>
                <div className="couple-names">Layla</div>
                <div className="ampersand">&amp;</div>
                <div className="couple-names">Omar</div>
                <div className="invite-text">Invite you to celebrate their wedding</div>
                <div className="invite-date">Saturday, June 28, 2026</div>
                <div className="invite-venue">The Grand Pavilion</div>
                <div className="phone-rsvp-btn">Open RSVP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
