import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import cloudsHero from '../../assets/clouds-hero.jpg';
import BoardingPassSplash from './BoardingPassSplash';
import { containInvitationPhoto, createRsvpSubmissionId, DEFAULT_COUPLE_MESSAGE, formatInvitationName, formatInvitationTime, getInvitationPhotoSrc } from '../shared';
import RsvpPlusOneField from '../RsvpPlusOneField';
import { getInvitationFontStyle } from '../fontOptions';
import { getTieredInvitationPhotos, getTieredStoryMilestones, invitationTierAllows } from '../tierAccess';
import InvitationPhoto from '../InvitationPhoto';
import useHeroScrollReset from '../useHeroScrollReset';
import './boarding-pass.css';
import boardingPassEnvelope from '../../assets/boardingPass/boarding-pass-envelope-transparent.png';
import heroEmpty from '../../assets/boardingPass/hero1Empty.png';
import confirmedStamp from '../../assets/boardingPass/confirmed_stamp_transparent.png';
import confirmYourSeatTitle from '../../assets/boardingPass/confirm_your_seat_title_transparent.png';
import loveFlightStamp from '../../assets/boardingPass/love_flight_stamp_transparent.png';

const API = import.meta.env.VITE_API_URL || '/api';

function buildMapEmbedUrl(rawUrl, fallbackQuery) {
  const url = (rawUrl || '').trim();
  if (url) {
    if (url.includes('/maps/embed')) return url;
    const coordMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
    }
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
      return `https://maps.google.com/maps?q=${placeMatch[1]}&output=embed`;
    }
    const queryMatch = url.match(/[?&]q=([^&]+)/);
    if (queryMatch) {
      return `https://maps.google.com/maps?q=${queryMatch[1]}&output=embed`;
    }
  }
  if (fallbackQuery && fallbackQuery.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery.trim())}&output=embed`;
  }
  return null;
}

export default function BoardingPassInvitation({ order, demo = false, publicSlug }) {
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, plusOne: false, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);
  const rsvpSubmissionId = useRef(createRsvpSubmissionId());
  const rootRef = useHeroScrollReset(showSplash);
  const galleryRef = useRef(null);
  const [demoOpenWindow, setDemoOpenWindow] = useState(false);

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

  // Auto-open one gallery "window blind" once when it scrolls into view so guests
  // discover that the memory windows are interactive, then let it close again.
  useEffect(() => {
    if (showSplash) return;
    const el = galleryRef.current;
    if (!el) return;
    let closeTimer;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setDemoOpenWindow(true);
            closeTimer = setTimeout(() => setDemoOpenWindow(false), 2400);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(closeTimer);
    };
  }, [showSplash]);

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
        body: JSON.stringify({ ...rsvpForm, submissionId: rsvpSubmissionId.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RSVP failed');
      setRsvpSubmitted(true);
    } catch (err) {
      setRsvpError(err.message);
    }
  };

  const wd = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const mapEnabled = fieldEnabled('venueMapUrl');
  const name1 = formatInvitationName(wd.groomName || 'Partner 1');
  const name2 = formatInvitationName(wd.brideName || 'Partner 2');
  const weddingDate = wd.weddingDate ? new Date(wd.weddingDate) : null;
  const dateStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const weekdayStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { weekday: 'long' })
    : '';
  const dateStrShort = weddingDate
    ? `${weddingDate.getDate()} ${weddingDate.toLocaleDateString('en-US', { month: 'long' })} ${weddingDate.getFullYear()}`
    : '';
  const timeStr = fieldEnabled('weddingTime') ? formatInvitationTime(wd.weddingTime, wd.timeFormat) : '';
  const venue = wd.venue || '';
  const venueAddress = '';
  const message = fieldEnabled('message')
    ? (wd.message !== undefined && wd.message !== null ? wd.message : 'Two Souls, One Destination.')
    : '';
  const coupleMessage = fieldEnabled('coupleMessage')
    ? (order.coupleMessage !== undefined && order.coupleMessage !== null
      ? order.coupleMessage
      : ((demo ? DEFAULT_COUPLE_MESSAGE : wd.message) || DEFAULT_COUPLE_MESSAGE))
    : '';
  const rsvpEnabled = fieldEnabled('rsvp') && invitationTierAllows(order, 'rsvp');
  const askPlusOne = Boolean(wd.askPlusOne);
  const shouldPlayMusic = invitationTierAllows(order, 'music') && Boolean(order.musicUrl && order.musicEnabled !== false);
  const pad = (n) => n.toString().padStart(2, '0');
  const isReferenceDemo = Boolean(demo && order.referenceLayout);

  // Categorize photos
  const allPhotos = getTieredInvitationPhotos(order);
  const storyMilestones = getTieredStoryMilestones(order);
  const couplePhotos = allPhotos.filter(p => p.label === 'couple');
  const storyPhotos = allPhotos.filter(p => p.label === 'story');
  const galleryPhotos = allPhotos.filter(p => p.label === 'gallery');
  const venuePhotos = allPhotos.filter(p => p.label === 'venue');
  const uncategorized = allPhotos.filter(p => !p.label || !['couple', 'story', 'gallery', 'venue'].includes(p.label));
  const allGallery = [...galleryPhotos, ...uncategorized];

  useEffect(() => {
    if (showSplash || !shouldPlayMusic || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = 0.55;
    audio.play().catch(() => {
      // Browsers may still block autoplay; guests can continue without sound.
    });
  }, [showSplash, shouldPlayMusic, order.musicUrl]);

  const handleSplashDismiss = () => {
    if (shouldPlayMusic && audioRef.current) {
      audioRef.current.volume = 0.55;
      audioRef.current.play().catch(() => {
        // Browser can still block sound; the invitation remains usable.
      });
    }
    setShowSplash(false);
  };

  // ===================== MAIN PAGE =====================
  return (
    <div ref={rootRef} className={`inv-page boarding-pass-theme${showSplash && !splashReady ? ' invitation-splash-gated' : ''}`} style={getInvitationFontStyle(order)}>
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && <BoardingPassSplash onReady={() => setSplashReady(true)} onDismiss={handleSplashDismiss} />}
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
          <div className="bp-hero-ticket">
            <img src={heroEmpty} alt="" className="bp-hero-ticket-img" />

            {/* Couple names */}
            <div className="bp-hero-names">
              <span className="bp-hero-name">{name1}</span>
              <span className="bp-hero-name">{name2}</span>
            </div>

            {/* Detail rows aligned with baked-in icons */}
            <div className="bp-hero-detail bp-hero-detail--date">
              <span className="bp-hero-detail-label">{weekdayStr || 'SATURDAY'}</span>
              <span className="bp-hero-detail-value">{dateStrShort || 'TBD'}</span>
            </div>
            <div className="bp-hero-detail bp-hero-detail--time">
              <span className="bp-hero-detail-label">BOARDING</span>
              <span className="bp-hero-detail-value">{timeStr || 'TBD'}</span>
            </div>
            <div className="bp-hero-detail bp-hero-detail--venue">
              <span className="bp-hero-detail-value">{venue || 'TBD'}</span>
            </div>

            {/* Confirmed rubber-stamp overlay — stamps down once the splash is dismissed */}
            <motion.img
              src={confirmedStamp}
              alt="Confirmed"
              className="bp-hero-stamp"
              initial={{ opacity: 0, scale: 2.4, rotate: -28 }}
              animate={showSplash ? { opacity: 0, scale: 2.4, rotate: -28 } : { opacity: 1, scale: 1, rotate: -8 }}
              transition={{ delay: showSplash ? 0 : 1, type: 'spring', stiffness: 320, damping: 14, mass: 0.7 }}
            />
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
            <h2 className="inv-section-label">Boarding In</h2>
            <div className="inv-gold-divider" />
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
          <h2 className="inv-section-label">The Couple</h2>
          <div className="inv-gold-divider" />
          <div className="inv-couple-gallery">
            {couplePhotos.map((p, i) => (
              <div key={i} className="airplane-window inv-couple-photo-item">
                <InvitationPhoto src={p} alt={`Couple ${i + 1}`} sizes="(max-width: 768px) 80vw, 240px" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========== OUR STORY ========== */}
      {isReferenceDemo && storyMilestones.length ? (
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
            {storyMilestones.map((m, i) => (
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
                  <InvitationPhoto src={containInvitationPhoto(order.storyImages[i])} alt={m.title} sizes="(max-width: 640px) 80vw, 320px" />
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
              const milestone = storyMilestones?.[i];
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
                    <InvitationPhoto src={containInvitationPhoto(photo)} alt={milestone?.title || `Story ${i + 1}`} sizes="(max-width: 640px) 80vw, 320px" />
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
          className="inv-section-label"
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
            <div className="inv-event-details inv-event-details--centered">
              <div>
                <p className="data-label">DESTINATION</p>
                <p className="font-mono-data inv-event-value">{venue}</p>
              </div>
              {dateStr && (
                <div>
                  <p className="data-label">DATE</p>
                  <p className="font-mono-data inv-event-value">{dateStr}</p>
                </div>
              )}
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

            {(() => {
              if (!mapEnabled) return null;
              const embedSrc = buildMapEmbedUrl(wd.venueMapUrl, [venue, venueAddress].filter(Boolean).join(', '));
              if (!embedSrc) return null;
              const openHref = wd.venueMapUrl
                ? wd.venueMapUrl
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, venueAddress].filter(Boolean).join(', '))}`;
              return (
                <div className="inv-map-container">
                  <div className="airplane-window inv-map-window">
                    <iframe src={embedSrc} title="Venue location" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    <a
                      className="inv-map-click-overlay"
                      href={openHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open location in Google Maps"
                    />
                  </div>
                </div>
              );
            })()}

            {!isReferenceDemo && venuePhotos.length > 0 && (
              <div className="inv-venue-photos-wrap">
                <p className="data-label">VENUE</p>
                <div className="inv-venue-photos">
                  {venuePhotos.map((p, i) => (
                    <div key={i} className="airplane-window inv-venue-photo-item">
                      <InvitationPhoto src={p} alt={`Venue ${i + 1}`} sizes="200px" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {coupleMessage && <BoardingPassMessageSection message={coupleMessage} />}

      {/* ========== RSVP ========== */}
      {rsvpEnabled && (
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
          <img src={confirmYourSeatTitle} alt="Confirm Your Seat — Reserve your place on this flight of love" className="bp-rsvp-title-img" />

          <AnimatePresence mode="wait">
            {!rsvpSubmitted ? (
              <motion.div key="form" className="inv-rsvp-wrap" exit={{ opacity: 0, y: -20 }}>
                <form onSubmit={handleRsvp} className="inv-rsvp-card-enhanced">
                  <div className="inv-rsvp-card-header">
                    <span className="data-label text-gold">PASSENGER CHECK-IN</span>
                  </div>

                  <div className="inv-rsvp-fields">
                    <div className="inv-form-field">
                      <label className="data-label">PASSENGER NAME</label>
                      <input type="text" required className="kiosk-input" value={rsvpForm.guestName} onChange={e => setRsvpForm({ ...rsvpForm, guestName: e.target.value })} placeholder="Your full name" />
                    </div>

                    <div className="inv-form-field">
                      <label className="data-label">WILL YOU BE BOARDING?</label>
                      <div className="inv-radio-group" role="radiogroup" aria-label="Will you be boarding?">
                        <button type="button" role="radio" aria-checked={rsvpForm.attending === 'yes'} className={`inv-radio-btn ${rsvpForm.attending === 'yes' ? 'active' : ''}`} onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          YES
                        </button>
                        <button type="button" role="radio" aria-checked={rsvpForm.attending === 'maybe'} className={`inv-radio-btn ${rsvpForm.attending === 'maybe' ? 'active' : ''}`} onClick={() => setRsvpForm({ ...rsvpForm, attending: 'maybe' })}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          MAYBE
                        </button>
                        <button type="button" role="radio" aria-checked={rsvpForm.attending === 'no'} className={`inv-radio-btn ${rsvpForm.attending === 'no' ? 'active' : ''}`} onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          NO
                        </button>
                      </div>
                    </div>

                    {askPlusOne && (
                      <div className="inv-form-field">
                        <RsvpPlusOneField
                          label="BRINGING A PLUS-ONE?"
                          value={rsvpForm.plusOne}
                          onChange={value => setRsvpForm({ ...rsvpForm, plusOne: value })}
                        />
                      </div>
                    )}

                    <div className="inv-form-field">
                      <label className="data-label">MESSAGE TO THE COUPLE</label>
                      <textarea className="kiosk-input" rows={3} value={rsvpForm.message} onChange={e => setRsvpForm({ ...rsvpForm, message: e.target.value })} placeholder="Write your wishes..." />
                    </div>
                  </div>

                  {rsvpError && <p className="inv-rsvp-error">{rsvpError}</p>}

                  <div className="bp-rsvp-note-row">
                    <img src={loveFlightStamp} alt="" className="bp-rsvp-note-stamp" aria-hidden />
                    <div className="bp-rsvp-thanks">
                      <span className="bp-rsvp-thanks-label">THANK YOU &#9829;</span>
                      <span className="bp-rsvp-thanks-text">We can&rsquo;t wait to celebrate with you!</span>
                    </div>
                  </div>

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
                  <motion.img
                    src={confirmedStamp}
                    alt="Confirmed"
                    className="bp-rsvp-success-stamp"
                    initial={{ scale: 1.5, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }}
                  />
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
      )}

      {/* ========== GALLERY ========== */}
      {invitationTierAllows(order, 'gallery') && isReferenceDemo && order.galleryImages?.length ? (
        <section className="inv-section-dark" ref={galleryRef}>
          <motion.h2
            className="inv-section-label"
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
                className={`airplane-window inv-gallery-item window-blind-container${i === 0 && demoOpenWindow ? ' is-demo-open' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img src={getInvitationPhotoSrc(src)} alt={`Gallery ${i + 1}`} />
                <div className="inv-gallery-blind">
                  <span>Memories</span><span className="inv-blind-ornament">✦</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ) : allGallery.length > 0 ? (
        <section className="inv-section-dark" ref={galleryRef}>
          <motion.h2
            className="inv-section-label"
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
                className={`airplane-window inv-gallery-item window-blind-container${i === 0 && demoOpenWindow ? ' is-demo-open' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <img src={getInvitationPhotoSrc(p)} alt={`Gallery ${i + 1}`} />
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
          <p className="inv-footer-thanks">With love</p>
          <div className="inv-footer-divider" />
          <p className="inv-footer-couple">{name1} &amp; {name2}</p>
        </motion.div>
        <div className="inv-footer-bar">
          <span className="inv-footer-bar-text">Thank you for being part of our beginning</span>
        </div>
      </section>
    </div>
  );
}

function BoardingPassMessageSection({ message }) {
  return (
    <section className="inv-message-section">
      <h2 className="inv-message-title">A Note</h2>
      <div className="inv-gold-divider" />
      <motion.div
        className="inv-envelope"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <img className="inv-envelope-image" src={boardingPassEnvelope} alt="" aria-hidden="true" />
        <article className="inv-envelope-copy">
          <span>From Our Hearts to Yours</span>
          <p>{message}</p>
        </article>
      </motion.div>
    </section>
  );
}

function FlapDigit({ value, label }) {
  return (
    <div className="inv-flap">
      <div className="inv-flap-digits">
        {value.split('').map((digit, i) => (
          <motion.div
            key={`${value}-${i}`}
            className="flap-digit"
            initial={{ rotateX: -90, opacity: 0 }}
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
