import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../lib/pricingTiers';
import '../styles/Pricing.css';
import useReveal from '../hooks/useReveal';

export default function Pricing() {
  const headerRef = useReveal();
  const cardRef = useReveal();

  return (
    <section className="section pricing-section" id="pricing">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">Choose the invitation experience</h2>
          <p className="section-subtitle">
            Three one-time plans, each matched to the sections your hosted wedding invitation will include.
          </p>
        </div>

        <div className="pricing-wrapper reveal" ref={cardRef}>
          {PRICING_TIERS.map(tier => (
            <article key={tier.id} className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}>
              <div className="pricing-badge">{tier.badge}</div>
              <div className="pricing-plan-name">{tier.name}</div>
              <div className="pricing-amount">
                <span className="old-price">{tier.oldPrice}</span>
                {tier.price}
              </div>
              <div className="pricing-desc">{tier.description}</div>

              <ul className="pricing-features">
                {tier.features.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="pricing-cta">
                <Link to={`/order?tier=${tier.id}`} className="btn btn-gold pricing-cta-btn">
                  Choose {tier.name}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
