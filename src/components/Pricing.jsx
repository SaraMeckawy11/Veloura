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

const API = import.meta.env.VITE_API_URL || '/api';

// Small demo thumbnails keyed by the invitation display name used in
// PRICING_TIERS.demoCards, so each plan can show the real design preview.
const DEMO_PREVIEW_IMAGES = {
  'Coastal Breeze': coastalSplashPreview,
  'Fountain Reverie I': fountainHero1Preview,
  'Fountain Reverie II': fountainHero2Preview,
  'Garden Pavilion': GardenPavilionPreview,
  'Theater': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=300&h=300&fit=crop&q=80',
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

// The sections each plan unlocks, shown as chips under the design squares so
// buyers see exactly which fields a tier's invitations include.
function getTierFieldChips(tier) {
  const chips = ['Names, date & venue', 'Countdown', 'Map'];
  if (tier.sections?.coupleMessage) chips.push('Envelope note');
  if (tier.sections?.story) chips.push('Our Story');
  if (tier.sections?.gallery) chips.push('Gallery');
  if (tier.sections?.rsvp) chips.push('RSVP');
  return chips;
}

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
              {tier.tagline && <div className="pricing-tagline">{tier.tagline}</div>}
              <div className="pricing-desc">{tier.description}</div>

              <ul className="pricing-features">
                {tier.features.map(feature => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="pricing-demos">
                <span className="pricing-demos-label">Designs in this plan</span>
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
                <ul className="pricing-demos-fields" aria-label={`Fields included in ${tier.name}`}>
                  {getTierFieldChips(tier).map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>

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
        {pricingCatalog?.displayIsConverted && (
          <p className="pricing-currency-note">
            Prices are shown in EGP for Egypt. Secure checkout is processed in USD by PayPal.
          </p>
        )}
      </div>
    </section>
  );
}
