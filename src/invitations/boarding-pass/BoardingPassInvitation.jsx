import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import cloudsHero from '../../assets/clouds-hero.jpg';
import BoardingPassSplash from './BoardingPassSplash';
import './boarding-pass.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function BoardingPassInvitation({ order, demo = false, publicSlug }) {
  const [showSplash, setShowSplash] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  // Countdown
  useEffect(() => {
    if (!order?.weddingDetails?.weddingDate) return;
    const target = new Date(order.weddingDetails.weddingDate).getTime();
    const calc = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleRsvp = async (e) => {
    e.preventDefault();
    setRsvpError('');
    if (demo) {
      setRsvpSubmitted(true);
      return;
    }
    try {
      const res = await fetch(`${API}/rsvps/${publicSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RSVP failed');
      setRsvpSubmitted(true);
    } catch (err) {
      setRsvpError(err.message);
    }
  };

  const wd = order.weddingDetails || {};
  const name1 = wd.groomName || 'Partner 1';
  const name2 = wd.brideName || 'Partner 2';
  const weddingDate = wd.weddingDate ? new Date(wd.weddingDate) : null;
  const dateStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const timeStr = wd.weddingTime || '';
  const venue = wd.venue || '';
  const venueAddress = wd.venueAddress || '';
  const message = wd.message || 'Two Souls, One Destination.';
  const flightNo = wd.flightNo || `WD-${weddingDate ? weddingDate.getFullYear() : '2026'}`;
  const pad = (n) => n.toString().padStart(2, '0');
  const initials = `${name1[0]}${name2[0]}`;

  const isReferenceDemo = Boolean(demo && order.referenceLayout);

  // Categorize photos
  const allPhotos = order.photos || [];
  const couplePhotos = allPhotos.filter(p => p.label === 'couple');
  const storyPhotos = allPhotos.filter(p => p.label === 'story');
  const galleryPhotos = allPhotos.filter(p => p.label === 'gallery');
  const venuePhotos = allPhotos.filter(p => p.label === 'venue');
  const uncategorized = allPhotos.filter(p => !p.label || !['couple', 'story', 'gallery', 'venue'].includes(p.label));
  const allGallery = [...galleryPhotos, ...uncategorized];

  // ===================== SPLASH SCREEN =====================
  if (showSplash) {
    return <BoardingPassSplash onDismiss={() => setShowSplash(false)} />;
  }

  // ===================== MAIN PAGE =====================
  return (
    <div className="inv-page boarding-pass-theme">
      {/* ========== HERO ========== */}
      <section className="inv-hero">
        {/* Cloud background with parallax scroll */}
        <div className="inv-hero-bg">
          <div className="inv-clouds-scroll">
            <img src={cloudsHero} alt="" className="inv-cloud-img" />
            <img src={cloudsHero} alt="" className="inv-cloud-img" />
          </div>
          <div className="inv-hero-overlay" />
        </div>

        {/* Boarding Pass Card */}
        <motion.div
          className="inv-boarding-card"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <div className="boarding-pass-card">
            <div className="inv-boarding-inner">
              {/* Main content — left 70% */}
              <div className="inv-boarding-main">
                <div className="inv-boarding-header">
                  <span className="data-label text-gold">BOARDING PASS</span>
                  <span className="data-label">{flightNo}</span>
                </div>
                <h1 className="inv-couple-names">
                  {name1}<span className="inv-ampersand">&amp;</span>{name2}
                </h1>
                <div className="inv-gold-divider" style={{ margin: '12px 0 16px' }} />
                <p className="inv-tagline">{message}</p>
                <div className="inv-data-grid">
                  <div className="inv-data-item">
                    <p className="data-label">FLIGHT</p>
                    <p className="data-value font-mono-data">{dateStr}</p>
                  </div>
                  <div className="inv-data-item">
                    <p className="data-label">DESTINATION</p>
                    <p className="data-value font-mono-data" style={{ fontSize: '0.85rem' }}>{venue}</p>
                  </div>
                  <div className="inv-data-item">
                    <p className="data-label">GATE</p>
                    <p className="data-value font-mono-data">{timeStr || 'TBD'}</p>
                  </div>
                  <div className="inv-data-item">
                    <p className="data-label">SEAT</p>
                    <p className="data-value font-mono-data">FOREVER</p>
                  </div>
                </div>
              </div>

              {/* Perforation + stub */}
              <div className="inv-perf-container">
                <div className="inv-perf-circle-top" />
                <div className="inv-perf-line" />
                <div className="inv-perf-circle-bottom" />
              </div>

              <div className="inv-boarding-stub">
                <motion.div
                  className="stamp"
                  initial={{ scale: 1.5, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: -15 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 15, delay: 1.2 }}
                >
                  CONFIRMED
                </motion.div>
                <div className="data-label" style={{ marginTop: '16px' }}>{flightNo}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== COUNTDOWN ========== */}
      {weddingDate && (
        <section className="inv-section-dark">
          <div className="inv-corner-tl" /><div className="inv-corner-tr" />
          <div className="inv-corner-bl" /><div className="inv-corner-br" />
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="inv-section-label text-gold">Boarding In</h2>
            <div className="inv-gold-divider" style={{ marginBottom: 40 }} />
            <div className="inv-countdown-grid">
              <FlapDigit value={pad(timeLeft.days)} label="DAYS" />
              <span className="inv-colon">:</span>
              <FlapDigit value={pad(timeLeft.hours)} label="HOURS" />
              <span className="inv-colon">:</span>
              <FlapDigit value={pad(timeLeft.minutes)} label="MINUTES" />
              <span className="inv-colon">:</span>
              <FlapDigit value={pad(timeLeft.seconds)} label="SECONDS" />
            </div>
          </motion.div>
        </section>
      )}

      {/* ========== COUPLE PHOTOS (not in reference template) ========== */}
      {!isReferenceDemo && couplePhotos.length > 0 && (
        <section className="inv-section-light">
          <h2 className="inv-section-label text-gold">The Couple</h2>
          <div className="inv-couple-gallery">
            {couplePhotos.map((p, i) => (
              <div key={i} className="airplane-window inv-couple-photo-item">
                <img src={p.url} alt={`Couple ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========== OUR STORY ========== */}
      {isReferenceDemo && order.storyMilestones?.length ? (
        <section className="inv-section-light">
          <p className="inv-section-label-mono">FLIGHT ROUTE</p>
          <motion.h3
            className="inv-story-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Story
          </motion.h3>
          <div className="inv-story-divider" />
          <div className="inv-story-timeline">
            <div className="inv-flight-path" />
            {order.storyMilestones.map((m, i) => (
              <motion.div
                key={i}
                className={`inv-story-item ${i % 2 === 0 ? 'left' : 'right'}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className={`inv-story-content inv-story-text ${i % 2 === 0 ? 'align-right' : 'align-left'}`}>
                  <span className="inv-story-date">{m.date}</span>
                  <h4 className="inv-story-heading">{m.title}</h4>
                  <p className="inv-story-desc">{m.description}</p>
                </div>
                <div className="inv-story-dot">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.7 3.3-3.3 3.3-2-.7c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.1.9l3.3 2.3 2.3 3.3c.2.3.6.3.9.1l.3-.2c.3-.2.4-.6.3-1l-.7-2 3.3-3.3 3.3 5.7c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                </div>
                <div className="inv-story-photo">
                  <img src={order.storyImages[i]} alt={m.title} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ) : storyPhotos.length > 0 ? (
        <section className="inv-section-light">
          <p className="inv-section-label-mono">FLIGHT ROUTE</p>
          <motion.h3
            className="inv-story-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Story
          </motion.h3>
          <div className="inv-story-divider" />
          <div className="inv-story-timeline">
            <div className="inv-flight-path" />
            {storyPhotos.map((photo, i) => {
              const milestone = order.storyMilestones?.[i];
              return (
                <motion.div
                  key={i}
                  className={`inv-story-item ${i % 2 === 0 ? 'left' : 'right'}`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className={`inv-story-content inv-story-text ${i % 2 === 0 ? 'align-right' : 'align-left'}`}>
                    {milestone?.date && <span className="inv-story-date">{milestone.date}</span>}
                    {milestone?.title && <h4 className="inv-story-heading">{milestone.title}</h4>}
                    {milestone?.description && <p className="inv-story-desc">{milestone.description}</p>}
                  </div>
                  <div className="inv-story-dot">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.7 3.3-3.3 3.3-2-.7c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.1.9l3.3 2.3 2.3 3.3c.2.3.6.3.9.1l.3-.2c.3-.2.4-.6.3-1l-.7-2 3.3-3.3 3.3 5.7c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                  </div>
                  <div className="inv-story-photo">
                    <img src={photo.url} alt={milestone?.title || `Story ${i + 1}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ========== EVENT DETAILS ========== */}
      <section className="inv-section-dark">
        <div className="inv-corner-tl" /><div className="inv-corner-tr" />
        <motion.h2
          className="inv-section-label text-gold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Event Details
        </motion.h2>
        <div className="inv-gold-divider" />
        <motion.div
          className={`inv-event-wrap${isReferenceDemo ? ' inv-event-wrap--reference' : ''}`}
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="boarding-pass-card inv-event-card-inner">
            <div className="inv-event-header">
              <span className="data-label text-gold">FLIGHT NO: {flightNo}</span>
            </div>
            <h3 className="inv-event-title">CEREMONY</h3>
            <div className="inv-event-details">
              <div>
                <p className="data-label">TERMINAL</p>
                <p className="font-mono-data inv-event-value">{venue}</p>
              </div>
              <div>
                <p className="data-label">BOARDING</p>
                <p className="font-mono-data inv-event-value">{timeStr || 'See invitation'}</p>
              </div>
              {venueAddress && (
                <div>
                  <p className="data-label">GATE</p>
                  <p className="font-mono-data inv-event-value">{venueAddress}</p>
                </div>
              )}
            </div>

            {wd.venueMapUrl && (
              <div className="inv-map-container">
                <p className="data-label">LOCATION MAP</p>
                <div className="airplane-window inv-map-window">
                  <iframe src={wd.venueMapUrl} title="Venue location" allowFullScreen loading="lazy" />
                </div>
              </div>
            )}

            {!isReferenceDemo && venuePhotos.length > 0 && (
              <div className="inv-venue-photos-wrap">
                <p className="data-label">VENUE</p>
                <div className="inv-venue-photos">
                  {venuePhotos.map((p, i) => (
                    <div key={i} className="airplane-window inv-venue-photo-item">
                      <img src={p.url} alt={`Venue ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ========== RSVP ========== */}
      <section className="inv-rsvp-section">
        <div className="inv-rsvp-bg-decor">
          <div className="inv-rsvp-bg-line" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="inv-section-label-mono">BOARDING PASS</p>
          <h3 className="inv-rsvp-title">Confirm Your Seat</h3>
          <div className="inv-gold-divider" style={{ marginBottom: 12 }} />
          <p className="inv-rsvp-subtitle">Reserve your place on this flight of love</p>

          <AnimatePresence mode="wait">
            {!rsvpSubmitted ? (
              <motion.div key="form" className="inv-rsvp-wrap" exit={{ opacity: 0, y: -20 }}>
                <form onSubmit={handleRsvp} className="inv-rsvp-card-enhanced">
                  <div className="inv-rsvp-card-header">
                    <span className="data-label text-gold">PASSENGER CHECK-IN</span>
                    <span className="data-label">{flightNo}</span>
                  </div>

                  <div className="inv-rsvp-fields">
                    <div className="inv-form-field">
                      <label className="data-label">PASSENGER NAME</label>
                      <input type="text" required className="kiosk-input" value={rsvpForm.guestName} onChange={e => setRsvpForm({ ...rsvpForm, guestName: e.target.value })} placeholder="Your full name" />
                    </div>

                    <div className="inv-rsvp-row">
                      <div className="inv-form-field">
                        <label className="data-label">PASSENGERS</label>
                        <input type="number" min={1} max={10} className="kiosk-input" value={rsvpForm.guestCount} onChange={e => setRsvpForm({ ...rsvpForm, guestCount: parseInt(e.target.value) || 1 })} />
                      </div>
                      <div className="inv-form-field">
                        <label className="data-label">WILL YOU BE BOARDING?</label>
                        <div className="inv-radio-group">
                          <button type="button" className={`inv-radio-btn ${rsvpForm.attending === 'yes' ? 'active' : ''}`} onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            YES
                          </button>
                          <button type="button" className={`inv-radio-btn ${rsvpForm.attending === 'no' ? 'active' : ''}`} onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            NO
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="inv-form-field">
                      <label className="data-label">MESSAGE TO THE COUPLE</label>
                      <textarea className="kiosk-input" rows={3} value={rsvpForm.message} onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })} placeholder="Write your wishes..." />
                    </div>
                  </div>

                  {rsvpError && <p className="inv-rsvp-error">{rsvpError}</p>}

                  <div className="inv-rsvp-card-footer">
                    <div className="inv-rsvp-perf-line" />
                    <button type="submit" className="inv-rsvp-submit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.7 3.3-3.3 3.3-2-.7c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.1.9l3.3 2.3 2.3 3.3c.2.3.6.3.9.1l.3-.2c.3-.2.4-.6.3-1l-.7-2 3.3-3.3 3.3 5.7c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                      CHECK IN
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                className="inv-rsvp-wrap"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="inv-rsvp-card-enhanced inv-rsvp-success-card">
                  <motion.div
                    className="stamp inv-stamp-anim"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    CONFIRMED
                  </motion.div>
                  <div style={{ marginTop: '24px' }}>
                    <p className="data-label">PASSENGER</p>
                    <p className="inv-success-name">{rsvpForm.guestName}</p>
                    <div className="inv-success-plane">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.7 3.3-3.3 3.3-2-.7c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.1.9l3.3 2.3 2.3 3.3c.2.3.6.3.9.1l.3-.2c.3-.2.4-.6.3-1l-.7-2 3.3-3.3 3.3 5.7c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
                    </div>
                    <p className="inv-success-msg">Check-in Complete. See you at the gate.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ========== GALLERY ========== */}
      {isReferenceDemo && order.galleryImages?.length ? (
        <section className="inv-section-dark">
          <motion.h2
            className="inv-section-label text-gold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Gallery
          </motion.h2>
          <div className="inv-gold-divider" />
          <div className="inv-gallery-grid">
            {order.galleryImages.map((src, i) => (
              <motion.div
                key={i}
                className="airplane-window inv-gallery-item window-blind-container"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img src={src} alt={`Gallery ${i + 1}`} />
                <div className="inv-gallery-blind">
                  <span>Memories</span><span className="inv-blind-ornament">✦</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ) : allGallery.length > 0 ? (
        <section className="inv-section-dark">
          <motion.h2
            className="inv-section-label text-gold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Gallery
          </motion.h2>
          <div className="inv-gold-divider" />
          <div className="inv-gallery-grid">
            {allGallery.map((p, i) => (
              <motion.div
                key={i}
                className="airplane-window inv-gallery-item window-blind-container"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img src={p.url} alt={`Gallery ${i + 1}`} />
                <div className="inv-gallery-blind">
                  <span>Memories</span><span className="inv-blind-ornament">✦</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ========== FOOTER — Modern Premium ========== */}
      <section className="inv-footer">
        <div className="perforation-horizontal inv-footer-top-perf" />
        <motion.div
          className="inv-footer-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inv-footer-decor-ring" />
          <div className="inv-monogram">
            <span className="inv-mono-initials">{initials}</span>
          </div>
          <p className="inv-footer-thanks">Thank You</p>
          <div className="inv-footer-divider" />
          <p className="inv-footer-couple">{name1} &amp; {name2}</p>
          <p className="inv-footer-flight">{flightNo}</p>
        </motion.div>
        <div className="inv-footer-bar">
          <span className="inv-footer-bar-text">Made with love</span>
          <span className="inv-footer-bar-dot" />
          <span className="inv-footer-bar-text">Eternally</span>
        </div>
      </section>
    </div>
  );
}

function FlapDigit({ value, label }) {
  const [prevValue, setPrevValue] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="inv-flap">
      <div className="inv-flap-digits">
        {value.split('').map((digit, i) => (
          <motion.div
            key={`${digit}-${i}-${flipping}`}
            className="flap-digit"
            initial={flipping ? { rotateX: -90, opacity: 0 } : { rotateX: 0, opacity: 1 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {digit}
          </motion.div>
        ))}
      </div>
      <span className="inv-flap-label">{label}</span>
    </div>
  );
}
