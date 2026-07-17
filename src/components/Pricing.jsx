import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../lib/pricingTiers';
import '../styles/Pricing.css';
import useReveal from '../hooks/useReveal';
import coastalSplashPreview from '../assets/coastal/thumbnail.png';
import fountainHero1Preview from '../assets/Fountain Reverie/thumbnail3.png';
import fountainHero2Preview from '../assets/Fountain Reverie/thumbnail4.png';
import boardingPassPreview from '../assets/boardingPass/thumbnail.png';
import GardenPavilionPreview from '../assets/gardenPavilion/thumbnail.png';
import theaterPreview from '../assets/theater/Thumbnail.png';

const API = import.meta.env.VITE_API_URL || '/api';

// Small demo thumbnails keyed by the invitation display name used in
// PRICING_TIERS.demoCards, so each plan can show the real design preview.
const DEMO_PREVIEW_IMAGES = {
  'Coastal Breeze': coastalSplashPreview,
  'Fountain Reverie I': fountainHero1Preview,
  'Fountain Reverie II': fountainHero2Preview,
  'Garden Pavilion': GardenPavilionPreview,
  'Theater': theaterPreview,
  'Boarding Pass': boardingPassPreview,
};

// Maps the demo display name to its template slug so each square can open the
// live demo (carrying the tier so the demo shows only that plan's sections).
const DEMO_SLUGS = {
  'Coastal Breeze': 'coastal-breeze',
  'Fountain Reverie I': 'fountain-reverie-v1',
  'Fountain Reverie II': 'fountain-reverie-v2',
  'Garden Pavilion': 'gazebo-garden',
  'Theater': 'theater',
  'Boarding Pass': 'boarding-pass',
};

export default function Pricing({ showCta = true }) {
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
    fetch(`${API}/pricing`, { cache: 'no-store' })
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
            Three one-time options, with dedicated pricing for Egypt and the rest of the world.
          </p>
          <p className="pricing-region-label">
            {pricingCatalog?.pricingRegion === 'egypt' ? 'Egypt pricing' : 'International pricing'}
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

              <ul className="pricing-features">
                {tier.features.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              {/* Per-plan demo thumbnails hidden for now.
              <div className="pricing-demos">
                <div className="pricing-demos-grid">
                  {tier.demoCards?.map(card => {
                    const slug = DEMO_SLUGS[card.invitation];
                    const href = slug ? `/demo/${slug}?tier=${tier.id}` : null;
                    return (
                      <Link
                        to={href || '#'}
                        className="pricing-demo-sq"
                        key={card.invitation}
                        title={`Preview ${card.invitation} (${tier.name})`}
                        aria-label={`Preview the ${card.invitation} design in the ${tier.name} plan`}
                      >
                        {DEMO_PREVIEW_IMAGES[card.invitation] ? (
                          <img src={DEMO_PREVIEW_IMAGES[card.invitation]} alt={`${card.invitation} invitation preview`} loading="lazy" />
                        ) : (
                          <span className="pricing-demo-sq-initial" aria-hidden="true">{card.invitation.charAt(0)}</span>
                        )}
                        <span className="pricing-demo-sq-name">{card.invitation}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              */}

              {showCta && (
                <div className="pricing-cta">
                  <Link to={`/order?tier=${tier.id}`} className="btn btn-gold pricing-cta-btn">
                    Choose {tier.name}
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
        <p className="pricing-currency-note">
          {pricingCatalog?.pricingRegion === 'egypt'
            ? 'Prices shown are the fixed launch prices for customers in Egypt.'
            : 'Prices shown are the launch prices for customers outside Egypt.'}
        </p>
      </div>
    </section>
  );
}
