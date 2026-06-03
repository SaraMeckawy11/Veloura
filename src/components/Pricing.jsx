import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../lib/pricingTiers';
import '../styles/Pricing.css';
import useReveal from '../hooks/useReveal';
import fountainHero1Preview from '../assets/Fountain Reverie/thumbnail1.png';
import fountainHero2Preview from '../assets/Fountain Reverie/thumbnail2.png';

const API = import.meta.env.VITE_API_URL || '/api';

// Small demo thumbnails keyed by the invitation display name used in
// PRICING_TIERS.demoCards, so each plan can show the real design preview.
const DEMO_PREVIEW_IMAGES = {
  'Coastal Breeze': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=300&fit=crop&q=80',
  'Fountain Reverie I': fountainHero1Preview,
  'Fountain Reverie II': fountainHero2Preview,
  'Garden Pavilion': '/assets/gazebo-watercolor-poster1.jpg',
  'Theater': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=300&h=300&fit=crop&q=80',
  'Boarding Pass': 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300&h=300&fit=crop&q=80',
};

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
            Two one-time plans, each matched to the sections your hosted wedding invitation will include.
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

        <div className="pricing-demo-showcase reveal" aria-label="Invitation demos by plan">
          {tiers.map(tier => (
            <section className="pricing-demo-tier" key={`${tier.id}-demos`}>
              <div className="pricing-demo-tier-header">
                <span>{tier.name}</span>
                <strong>Included invitation demos</strong>
              </div>
              <div className="pricing-demo-row">
                {tier.demoCards?.map(card => (
                  <article className="pricing-demo-card" key={card.invitation}>
                    <div className="pricing-demo-thumb">
                      {DEMO_PREVIEW_IMAGES[card.invitation] ? (
                        <img src={DEMO_PREVIEW_IMAGES[card.invitation]} alt={`${card.invitation} invitation preview`} loading="lazy" />
                      ) : (
                        <span aria-hidden="true">{card.invitation.charAt(0)}</span>
                      )}
                    </div>
                    <div className="pricing-demo-card-body">
                      <strong>{card.invitation}</strong>
                      <ul className="pricing-demo-fields">
                        {card.fields.map(field => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        {pricingCatalog?.displayIsConverted && (
          <p className="pricing-currency-note">
            Prices are shown in EGP for Egypt. Secure checkout is processed in USD by PayPal.
          </p>
        )}
      </div>
    </section>
  );
}
