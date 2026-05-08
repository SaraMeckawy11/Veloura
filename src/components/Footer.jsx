import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const scrollToTop = (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-accent" />
      <div className="container">

        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              Velou<span>ra</span>
            </div>
            <p>
              Premium digital wedding invitations crafted with love.
              Cinematic animations, real-time RSVP, and everything you
              need to share your special day beautifully.
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

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 Veloura. All rights reserved.</span>
          <button className="footer-back-top" onClick={scrollToTop} aria-label="Back to top">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
