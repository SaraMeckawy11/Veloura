import './HowItWorks.css';
import useReveal from '../hooks/useReveal';

const steps = [
  {
    number: '1',
    title: 'Choose a Design',
    description: 'Browse our curated collection of cinematic invitation themes and pick the one that matches your vision.',
  },
  {
    number: '2',
    title: 'Personalize',
    description: 'Send us your details — names, date, venue, photo, colors, and music. We craft your custom invitation.',
  },
  {
    number: '3',
    title: 'Review & Approve',
    description: 'Preview your invitation on any device. Request free edits until it\'s perfect. No extra charges, ever.',
  },
  {
    number: '4',
    title: 'Share & Track',
    description: 'Get your unique link. Share via WhatsApp, social media, or email. Track RSVPs in real-time from your dashboard.',
  },
];

export default function HowItWorks() {
  const headerRef = useReveal();

  return (
    <section className="section how-section" id="how-it-works">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <span className="section-label">How It Works</span>
          <h2 className="section-title">From choosing to sharing in minutes</h2>
          <p className="section-subtitle">
            We handle everything. You just pick your style and share the link with your guests.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map(step => (
            <div className="step-card" key={step.number}>
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
