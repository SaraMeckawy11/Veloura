import { Link } from 'react-router-dom';
import '../styles/Pricing.css';
import useReveal from '../hooks/useReveal';

const features = [
  'Any template theme',
  // 'Animated envelope reveal',
  'Live countdown timer',
  'Cinematic splash screen',
  'Couple photo, names & venue',
  'RSVP with guest tracking',
  'Google Maps venue embed',
  // 'Background music',
  'Custom subdomain link',
  'Share button for any platform',
  'Live forever — no expiry',
  'Invitation created instantly after payment',
];

export default function Pricing() {
  const headerRef = useReveal();
  const cardRef = useReveal();

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One price, everything included</h2>
          <p className="section-subtitle">
            No hidden fees. No subscriptions. One payment for your complete digital wedding invitation experience.
          </p>
        </div>

        <div className="pricing-wrapper reveal" ref={cardRef}>
          <div className="pricing-card">
            <div className="pricing-plan-name">All-Inclusive Package</div>
            <div className="pricing-amount">
              <span className="old-price">$149</span>
              $89
            </div>
            <div className="pricing-desc">One-time payment · No subscription · Limited time launch price</div>

            <ul className="pricing-features">
              {features.map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="pricing-cta">
              <Link to="/order" className="btn btn-gold pricing-cta-btn">Get Started Now</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
