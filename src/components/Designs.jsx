import { useState } from 'react';
import '../styles/Designs.css';
import useReveal from '../hooks/useReveal';

const designs = [
  {
    name: 'Velvet Rose',
    category: 'launch',
    envelope: 'Burgundy wax seal breaks open, rose petals scatter',
    description: 'Deep burgundy & ivory. Rose petals drift as couple names appear in calligraphy. Romantic, warm, timeless.',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(92,26,42,0.4), rgba(60,15,26,0.6))',
    badge: 'Available',
    badgeClass: 'badge-launch',
  },
  {
    name: 'Golden Hour',
    category: 'launch',
    envelope: 'Gold foil envelope unfolds with a warm light burst',
    description: 'Warm gold on cream. Golden hour light washes over names with soft lens flares. Luxurious and radiant.',
    image: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(184,134,11,0.3), rgba(139,105,20,0.5))',
    badge: 'Available',
    badgeClass: 'badge-launch',
  },
  {
    name: 'Sakura Spring',
    category: 'launch',
    envelope: 'Pale pink envelope opens, cherry blossoms cascade down',
    description: 'Soft pinks, blush whites, delicate branches. Cherry blossoms rain as names fade in. Universally loved.',
    image: 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(244,143,177,0.3), rgba(136,14,79,0.3))',
    badge: 'Available',
    badgeClass: 'badge-launch',
  },
  {
    name: 'Dark Romance',
    category: 'launch',
    envelope: 'Dark velvet envelope with blood-red wax seal cracks open',
    description: 'Deep blacks, burgundy, crimson. Typography fades through smoke, roses emerge. Moody, passionate.',
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(26,26,26,0.5), rgba(45,10,10,0.6))',
    badge: 'Available',
    badgeClass: 'badge-launch',
  },
  {
    name: 'Pharaonic',
    category: 'launch',
    envelope: 'Gold sarcophagus-style envelope with hieroglyphic border unseals',
    description: 'Gold leaf, lapis blue, sandstone. Temple columns frame couple names. A design no competitor offers.',
    image: 'https://images.unsplash.com/photo-1553913861-c0a802e386bd?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(26,35,126,0.4), rgba(184,134,11,0.4))',
    badge: 'Available',
    badgeClass: 'badge-launch',
  },
  {
    name: 'Coastal Breeze',
    category: 'new',
    envelope: 'Sand-textured envelope washes away like a wave',
    description: 'Soft blues, sandy neutrals, watercolor. Tide reveals handwritten names. Perfect for beach weddings.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(38,166,154,0.3), rgba(0,77,64,0.4))',
    badge: 'Coming Soon',
    badgeClass: 'badge-new',
  },
  {
    name: 'Boarding Pass',
    category: 'new',
    envelope: 'Airmail envelope with vintage stamps slides open',
    description: 'Travel-themed ticket with hometowns as departure/arrival. Fun, playful, and shareable.',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(66,165,245,0.3), rgba(13,71,161,0.4))',
    badge: 'Coming Soon',
    badgeClass: 'badge-new',
  },
  {
    name: 'Midnight Garden',
    category: 'new',
    envelope: 'Dark envelope opens, fireflies emerge into the night',
    description: 'Navy & silver. Bioluminescent flowers bloom as moonlight reveals names. Enchanting and viral-worthy.',
    image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(13,27,42,0.5), rgba(26,35,56,0.6))',
    badge: 'Coming Soon',
    badgeClass: 'badge-new',
  },
  {
    name: 'F1 Race',
    category: 'future',
    envelope: 'Racing helmet visor lifts open',
    description: 'Grid lights countdown, names appear at green. Niche but viral for the motorsport community.',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(183,28,28,0.4), rgba(26,26,26,0.6))',
    badge: 'Future',
    badgeClass: 'badge-soon',
  },
  {
    name: 'Art Deco Noir',
    category: 'future',
    envelope: 'Black & gold geometric envelope fans open',
    description: 'Gatsby-era glamour. Art deco gates swing to reveal names. Bold and showstopping.',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(26,26,26,0.5), rgba(184,134,11,0.3))',
    badge: 'Future',
    badgeClass: 'badge-soon',
  },
  {
    name: 'Celestial',
    category: 'future',
    envelope: 'Star-map envelope dissolves into constellation',
    description: 'Deep blues, silver stars. Names as a star chart with the wedding date as a celestial event.',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(13,27,62,0.5), rgba(0,0,81,0.6))',
    badge: 'Future',
    badgeClass: 'badge-soon',
  },
  {
    name: 'Cinema',
    category: 'future',
    envelope: 'Film strip unrolls from a vintage envelope',
    description: 'Movie-poster aesthetic, film grain. Curtain draws to reveal names under spotlight.',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop&q=80',
    overlay: 'linear-gradient(135deg, rgba(62,39,35,0.5), rgba(26,26,26,0.6))',
    badge: 'Future',
    badgeClass: 'badge-soon',
  },
];

const filters = [
  { label: 'All Designs', value: 'all' },
  { label: 'Available Now', value: 'launch' },
  { label: 'Coming Soon', value: 'new' },
  { label: 'Future', value: 'future' },
];

export default function Designs() {
  const [activeFilter, setActiveFilter] = useState('all');
  const revealRef = useReveal();

  const filtered = activeFilter === 'all'
    ? designs
    : designs.filter(d => d.category === activeFilter);

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

        <div className="designs-filter">
          {filters.map(f => (
            <button
              key={f.value}
              className={`filter-btn${activeFilter === f.value ? ' active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="designs-grid">
          {filtered.map(design => (
            <div className="design-card" key={design.name}>
              <div className="design-card-preview">
                <div
                  className="design-card-image"
                  style={{
                    backgroundImage: `${design.overlay}, url(${design.image})`,
                  }}
                >
                  <span className="design-preview-text">{design.name}</span>
                </div>
                <span className={`design-badge ${design.badgeClass}`}>{design.badge}</span>
              </div>
              <div className="design-card-body">
                <h3>{design.name}</h3>
                <div className="design-card-envelope">{design.envelope}</div>
                <p>{design.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
