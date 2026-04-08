import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    document.body.style.overflow = '';
    const target = document.querySelector(href);
    if (target) {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const toggleMenu = () => {
    setMenuOpen(prev => {
      document.body.style.overflow = !prev ? 'hidden' : '';
      return !prev;
    });
  };

  const links = [
    { label: 'Designs', href: '#designs' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Get in Touch', href: '#contact' },
  ];

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Eternal<span>ly</span>
          </a>

          <ul className="nav-links">
            {links.map(link => (
              <li key={link.href}>
                <a href={link.href} onClick={e => handleNavClick(e, link.href)}>{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <a href="#" className="btn-client">Client Portal</a>
            <a href="#pricing" className="btn btn-gold btn-sm" onClick={e => handleNavClick(e, '#pricing')}>
              Create My Invitation
            </a>
          </div>

          <button
            className={`menu-toggle${menuOpen ? ' active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {links.map(link => (
          <a key={link.href} href={link.href} onClick={e => handleNavClick(e, link.href)}>
            {link.label}
          </a>
        ))}
        <div className="mobile-cta">
          <a href="#" className="btn btn-secondary btn-sm" onClick={e => { e.preventDefault(); setMenuOpen(false); document.body.style.overflow = ''; }}>
            Client Portal
          </a>
          <a href="#pricing" className="btn btn-gold btn-sm" onClick={e => handleNavClick(e, '#pricing')}>
            Create My Invitation
          </a>
        </div>
      </div>
    </>
  );
}
