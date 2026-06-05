import { useNavigate } from 'react-router-dom';
import coastalSplashPreview from '../assets/coastal/thumbnail.png';
import fountainHero1Preview from '../assets/Fountain Reverie/thumbnail3.png';
import fountainHero2Preview from '../assets/Fountain Reverie/thumbnail4.png';
import boardingPassPreview from '../assets/boardingPass/thumbnail.png';
import GardenPavilionPreview from '../assets/gardenPavilion/thumbnail.png';
import '../styles/Designs.css';
import useReveal from '../hooks/useReveal';

const designs = [
  {
    name: 'Garden Pavilion',
    previewName: (
      <>
        <span>Garden</span>
        <span>Pavilion</span>
      </>
    ),
    previewClassName: 'design-preview-text--gazebo',
    category: 'launch',
    description: 'Watercolor garden elegance with soft florals and romantic details.',
    image: GardenPavilionPreview,
    overlay: 'linear-gradient(135deg, rgba(91,125,68,0.12), rgba(255,255,245,0.22))',
    hidePreviewText: true,
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/gazebo-garden',
  },
  {
    name: 'Boarding Pass',
    category: 'launch',
    description: 'A playful travel-ticket design for destination-inspired celebrations.',
    image: boardingPassPreview,
    overlay: 'linear-gradient(135deg, rgba(66,165,245,0.08), rgba(13,71,161,0.1))',
    hidePreviewText: true,
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/boarding-pass',
  },
  {
    name: 'Coastal Breeze',
    category: 'launch',
    description: 'Coastal blues, watercolor details, and effortless seaside romance.',
    image: coastalSplashPreview,
    overlay: 'linear-gradient(135deg, rgba(31,95,143,0.16), rgba(236,134,111,0.12))',
    hidePreviewText: true,
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/coastal-breeze',
  },
  {
    name: 'Fountain Reverie I',
    category: 'launch',
    description: 'A sunlit garden fountain design with ornate gold typography and an elegant door reveal.',
    image: fountainHero1Preview,
    overlay: 'linear-gradient(135deg, rgba(148,116,47,0.12), rgba(245,223,207,0.18))',
    hidePreviewText: true,
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/fountain-reverie-v1',
  },
  {
    name: 'Fountain Reverie II',
    category: 'launch',
    description: 'A brighter floral fountain scene framed by garden pillars, soft gold, and romantic script.',
    image: fountainHero2Preview,
    overlay: 'linear-gradient(135deg, rgba(91,72,28,0.12), rgba(135,145,108,0.14))',
    hidePreviewText: true,
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/fountain-reverie-v2',
  },
  {
    name: 'Theater',
    previewName: (
      <>
        <span>Opening Night</span>
        <span>Theater</span>
      </>
    ),
    previewClassName: 'design-preview-text--theater',
    category: 'launch',
    description: 'A velvet-stage wedding with gilded marquee details and a cinematic curtain reveal.',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(45,7,16,0.62), rgba(201,164,90,0.2))',
    badge: 'Available',
    badgeClass: 'badge-launch',
    demoPath: '/demo/theater',
  },
  // {
  //   name: 'Velvet Rose',
  //   category: 'new',
  //   envelope: 'Burgundy wax seal breaks open, rose petals scatter',
  //   description: 'Deep burgundy & ivory. Rose petals drift as couple names appear in calligraphy. Romantic, warm, timeless.',
  //   image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(92,26,42,0.4), rgba(60,15,26,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Golden Hour',
  //   category: 'new',
  //   envelope: 'Gold foil envelope unfolds with a warm light burst',
  //   description: 'Warm gold on cream. Golden hour light washes over names with soft lens flares. Luxurious and radiant.',
  //   image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(184,134,11,0.3), rgba(139,105,20,0.5))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Sakura Spring',
  //   category: 'new',
  //   envelope: 'Pale pink envelope opens, cherry blossoms cascade down',
  //   description: 'Soft pinks, blush whites, delicate branches. Cherry blossoms rain as names fade in. Universally loved.',
  //   image: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(244,143,177,0.3), rgba(136,14,79,0.3))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Dark Romance',
  //   category: 'new',
  //   envelope: 'Dark velvet envelope with blood-red wax seal cracks open',
  //   description: 'Deep blacks, burgundy, crimson. Typography fades through smoke, roses emerge. Moody, passionate.',
  //   image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(26,26,26,0.5), rgba(45,10,10,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Pharaonic',
  //   category: 'new',
  //   envelope: 'Gold sarcophagus-style envelope with hieroglyphic border unseals',
  //   description: 'Gold leaf, lapis blue, sandstone. Temple columns frame couple names. A design no competitor offers.',
  //   image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(26,35,126,0.4), rgba(184,134,11,0.4))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Midnight Garden',
  //   category: 'new',
  //   envelope: 'Dark envelope opens, fireflies emerge into the night',
  //   description: 'Navy & silver. Bioluminescent flowers bloom as moonlight reveals names. Enchanting and viral-worthy.',
  //   image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(13,27,42,0.5), rgba(26,35,56,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'F1 Race',
  //   category: 'new',
  //   envelope: 'Racing helmet visor lifts open',
  //   description: 'Grid lights countdown, names appear at green. Niche but viral for the motorsport community.',
  //   image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(183,28,28,0.4), rgba(26,26,26,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Art Deco Noir',
  //   category: 'new',
  //   envelope: 'Black & gold geometric envelope fans open',
  //   description: 'Gatsby-era glamour. Art deco gates swing to reveal names. Bold and showstopping.',
  //   image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(26,26,26,0.5), rgba(184,134,11,0.3))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Celestial',
  //   category: 'new',
  //   envelope: 'Star-map envelope dissolves into constellation',
  //   description: 'Deep blues, silver stars. Names as a star chart with the wedding date as a celestial event.',
  //   image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(13,27,62,0.5), rgba(0,0,81,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
  // {
  //   name: 'Cinema',
  //   category: 'new',
  //   envelope: 'Film strip unrolls from a vintage envelope',
  //   description: 'Movie-poster aesthetic, film grain. Curtain draws to reveal names under spotlight.',
  //   image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop&q=80',
  //   overlay: 'linear-gradient(135deg, rgba(62,39,35,0.5), rgba(26,26,26,0.6))',
  //   badge: 'Coming Soon',
  //   badgeClass: 'badge-new',
  // },
];

export default function Designs() {
  const revealRef = useReveal();
  const navigate = useNavigate();

  return (
    <section className="section designs-section" id="designs">
      <div className="container">
        <div className="section-header reveal" ref={revealRef}>
          <span className="section-label">Our Collection</span>
          <h2 className="section-title">Stunning Invitation Designs</h2>
          <p className="section-subtitle">
            Every theme features an animated envelope reveal, cinematic splash screen, and full interactive invitation with RSVP.
          </p>
        </div>

        {/* {availableFilters.length > 1 && (
          <div className="designs-filter">
            {availableFilters.map(f => (
              <button
                key={f.value}
                className={`filter-btn${activeFilter === f.value ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )} */}

        <div className="designs-grid">
          {designs.map(design => (
            <div
              className={`design-card${design.demoPath ? ' design-card--demo' : ''}`}
              key={design.name}
              role={design.demoPath ? 'button' : undefined}
              tabIndex={design.demoPath ? 0 : undefined}
              onClick={() => design.demoPath && navigate(design.demoPath)}
              onKeyDown={(e) => {
                if (!design.demoPath) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(design.demoPath);
                }
              }}
            >
              <div className="design-card-preview">
                <div
                  className={`design-card-image ${design.imageClassName || ''}`.trim()}
                  style={{
                    backgroundImage: `${design.overlay}, url(${design.image})`,
                  }}
                >
                  {!design.hidePreviewText && (
                    <span className={`design-preview-text ${design.previewClassName || ''}`.trim()}>
                      {design.previewName || design.name}
                    </span>
                  )}
                </div>
                <span className={`design-badge ${design.badgeClass}`}>{design.badge}</span>
                {design.demoPath && (
                  <span className="design-demo-hint" aria-hidden>View live demo</span>
                )}
              </div>
              <div className="design-card-body">
                <h3>{design.name}</h3>
                <p>{design.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
