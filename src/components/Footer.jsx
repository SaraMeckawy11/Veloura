import { Link } from 'react-router-dom';
import '../styles/Footer.css';

export default function Footer() {
  const footerLinks = [
    { label: 'Designs', href: '#designs' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-panel">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Veloura home">
              Velou<span>ra</span>
            </Link>
            <p className="footer-tagline">
              Premium digital wedding invitations crafted with love.
            </p>
          </div>

          <div className="footer-action">
            <span className="footer-eyebrow">Ready when you are</span>
            <Link to="/order" className="footer-cta">Create My Invitation</Link>
          </div>
        </div>

        <div className="footer-main">
          <nav className="footer-links" aria-label="Footer navigation">
            {footerLinks.map(link => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>

          <div className="footer-social" aria-label="Social and contact links">
            <a href="mailto:veloura.invitations@gmail.com" aria-label="Email Veloura">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
            <a href="https://www.instagram.com/veloura.invites/" target="_blank" rel="noreferrer" aria-label="Veloura on Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#contact" aria-label="Contact Veloura">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 Veloura. All rights reserved.</span>
          <nav className="footer-legal" aria-label="Legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/refund-policy">Refunds</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
