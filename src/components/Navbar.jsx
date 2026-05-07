import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    document.body.style.overflow = '';

    // If we're not on the home page, navigate there with the hash so the
    // global ScrollToTop handler scrolls to the section after mount.
    if (location.pathname !== '/') {
      navigate('/' + href);
      return;
    }

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
  const showMobileStickyCta = location.pathname === '/' && scrolled && !menuOpen;

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Velou<span>ra</span>
          </a>

          <ul className="nav-links">
            {links.map(link => (
              <li key={link.href}>
                <a href={link.href} onClick={e => handleNavClick(e, link.href)}>{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-cta">
            <Link to="/my-invitation" className="btn-client">My Invitation</Link>
            <Link to="/order" className="btn btn-gold btn-sm">
              Create My Invitation
            </Link>
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
          <Link to="/my-invitation" className="btn btn-secondary btn-sm" onClick={() => { setMenuOpen(false); document.body.style.overflow = ''; }}>
            My Invitation
          </Link>
          <Link to="/order" className="btn btn-gold btn-sm" onClick={() => { setMenuOpen(false); document.body.style.overflow = ''; }}>
            Create My Invitation
          </Link>
        </div>
      </div>

      {location.pathname === '/' && (
        <Link
          to="/order"
          className={`mobile-sticky-cta${showMobileStickyCta ? ' visible' : ''}`}
        >
          Create My Invitation
        </Link>
      )}
    </>
  );
}
