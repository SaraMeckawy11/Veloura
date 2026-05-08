import { Link } from 'react-router-dom';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-accent" />
      <div className="container">

        <div className="footer-main">
          <div className="footer-logo">
            Velou<span>ra</span>
          </div>

          <p className="footer-tagline">
            Premium digital wedding invitations crafted with love.
          </p>

          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>

        <nav className="footer-legal" aria-label="Legal">
          <Link to="/terms">Terms of Service</Link>
          <span className="footer-legal-sep" aria-hidden="true">·</span>
          <Link to="/privacy">Privacy Policy</Link>
          <span className="footer-legal-sep" aria-hidden="true">·</span>
          <Link to="/refund-policy">Refund Policy</Link>
        </nav>

        <div className="footer-bottom">
          <span>&copy; 2026 Veloura. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
