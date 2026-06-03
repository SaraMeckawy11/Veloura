import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../lib/pricingTiers';
import '../styles/Pricing.css';
import useReveal from '../hooks/useReveal';

const API = import.meta.env.VITE_API_URL || '/api';

function getPricingQuery() {
  const params = new URLSearchParams();
  try {
    params.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    params.set('locale', navigator.language || '');
  } catch {
    return '';
  }
  return params.toString();
}

export default function Pricing() {
  const headerRef = useReveal();
  const cardRef = useReveal();
  const [pricingCatalog, setPricingCatalog] = useState(null);
  const tiers = pricingCatalog?.tiers?.length
    ? PRICING_TIERS.map(tier => ({
      ...tier,
      ...(pricingCatalog.tiers.find(remoteTier => remoteTier.id === tier.id) || {}),
    }))
    : PRICING_TIERS;

  useEffect(() => {
    const query = getPricingQuery();
    fetch(`${API}/pricing${query ? `?${query}` : ''}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.tiers?.length) setPricingCatalog(data);
      })
      .catch(() => {});
  }, []);

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
          {tiers.map(tier => (
            <article key={tier.id} className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}>
              <div className="pricing-badge">{tier.badge}</div>
              <div className="pricing-plan-name">{tier.name}</div>
              <div className="pricing-amount">
                <span className="old-price">{tier.oldDisplayPrice || tier.oldPrice}</span>
                {tier.displayPrice || tier.price}
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
        {pricingCatalog?.displayIsConverted && (
          <p className="pricing-currency-note">
            Egyptian prices are displayed in EGP using the configured USD exchange rate. Secure checkout is processed in USD by PayPal.
          </p>
        )}
      </div>
    </section>
  );
}
