import { useState } from 'react';
import '../styles/FAQ.css';
import useReveal from '../hooks/useReveal';

const faqs = [
  {
    q: 'How does the payment work?',
    a: "It's a simple one-time payment — no subscriptions, no hidden fees. You pay once and your invitation stays live forever. We accept all major credit/debit cards through our secure payment system.",
  },
  {
    q: 'Can I edit my invitation after it\'s published?',
    a: 'Yes! We offer a limited number of free edits for dates, times, venue details, and text. However, the couple names are permanently locked after payment — each invitation is tied to the original couple and cannot be reused for a different event.',
  },
  {
    q: 'How does the RSVP system work?',
    a: 'Your guests can RSVP directly from the invitation link. You get a real-time dashboard to track responses, plus-one confirmations, and total guest count.',
  },
  {
    q: 'Is the invitation mobile-friendly?',
    a: '100%. Every invitation is designed mobile-first and looks stunning on any device — phones, tablets, or desktops. Since most guests will open it via a shared link or social media, we optimize for the mobile experience first.',
  },
  {
    q: 'How long does it take to get my invitation?',
    a: 'Your invitation is created instantly the moment your payment is confirmed. You\'ll receive your invitation link right away — no waiting!',
  },
  {
    q: 'Can I add my own music?',
    a: 'Yes! You can choose from our curated library of elegant background tracks, or provide your own music file. The music plays as guests open your invitation, creating a truly immersive experience.',
  },
  {
    q: 'What if I need to change my wedding date?',
    a: 'Life happens and we understand. Date changes are completely free — just let us know and we\'ll update your invitation immediately. Your guests will always see the latest information.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const headerRef = useReveal();

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <div className="section-header reveal" ref={headerRef}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Questions? We've got answers</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={i}>
              <button className="faq-question" onClick={() => toggle(i)}>
                <span>{faq.q}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
