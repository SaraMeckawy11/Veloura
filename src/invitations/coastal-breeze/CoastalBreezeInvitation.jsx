import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import CoastalSplash from './CoastalSplash';
import './coastal-breeze.css';
import { buildInvitationImageSources, formatInvitationTime } from '../shared';
import InvitationPhoto from '../InvitationPhoto';

import ceremonyArch from '../../assets/coastal/beach-wedding-ceremony-illustration-watercolor-style-depicts-romantic-setup-arch-adorned-orange-roses-white-378559681.webp';
import cruiseShip from '../../assets/coastal/cruise-ship-clean.webp';
import blueShellAsset from '../../assets/coastal/blue-shell-transparent.webp';

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

const FlourishSvg = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 110 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M0 7 Q 18 0 36 7 T 72 7 T 110 7" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
    <circle cx="55" cy="7" r="2.2" fill="currentColor" opacity="0.85" />
    <circle cx="20" cy="7" r="1" fill="currentColor" opacity="0.6" />
    <circle cx="90" cy="7" r="1" fill="currentColor" opacity="0.6" />
  </svg>
);

const BlueShellMark = ({ className = '' }) => (
  <img className={className} src={blueShellAsset} alt="" aria-hidden="true" />
);

export default function CoastalBreezeInvitation({ order, demo = false, publicSlug }) {
  const [showSplash, setShowSplash] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);

  const wd = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const mapEnabled = fieldEnabled('venueMapUrl');
  const rsvpEnabled = fieldEnabled('rsvp');
  const name1 = wd.groomName || 'Partner 1';
  const name2 = wd.brideName || 'Partner 2';
  const weddingDate = wd.weddingDate ? new Date(wd.weddingDate) : null;
  const dayStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { weekday: 'long' })
    : '';
  const monthStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : '';
  const dayOfMonth = weddingDate ? weddingDate.getDate() : '';
  const fullDateStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const timeStr = fieldEnabled('weddingTime') ? formatInvitationTime(wd.weddingTime) : '';
  const venue = wd.venue || '';
  const venueAddress = fieldEnabled('venueAddress') ? (wd.venueAddress || '') : '';
  const message = fieldEnabled('message') ? (wd.message || 'With the sea as our witness, we begin forever.') : '';
  const tideCode = wd.flightNo || `COAST-${weddingDate ? weddingDate.getFullYear() : '2026'}`;
  const shouldPlayMusic = Boolean(order.musicUrl && order.musicEnabled !== false);
  const isReferenceDemo = Boolean(demo && order.referenceLayout);
  const pad = (n) => n.toString().padStart(2, '0');

  const allPhotos = order.photos || [];
  const couplePhotos = allPhotos.filter(p => p.label === 'couple');
  const storyPhotos = allPhotos.filter(p => p.label === 'story');
  const galleryPhotos = allPhotos.filter(p => p.label === 'gallery');
  const venuePhotos = allPhotos.filter(p => p.label === 'venue');
  const uncategorized = allPhotos.filter(p => !p.label || !['couple', 'story', 'gallery', 'venue'].includes(p.label));
  const allGallery = [...galleryPhotos, ...uncategorized];

  useEffect(() => {
    if (!order?.weddingDetails?.weddingDate) return undefined;
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

  useEffect(() => {
    if (showSplash || !shouldPlayMusic || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = 0.52;
    audio.play().catch(() => undefined);
  }, [showSplash, shouldPlayMusic, order.musicUrl]);

  useEffect(() => {
    const memorySources = isReferenceDemo && order.galleryImages?.length
      ? order.galleryImages
      : (order.photos || [])
        .filter(photo => photo.label === 'gallery' || !photo.label || !['couple', 'story', 'venue'].includes(photo.label))
        .map(photo => photo.url);

    const preloads = [...new Set(memorySources.filter(Boolean))]
      .slice(0, 6)
      .map((src) => buildInvitationImageSources(src));

    const links = preloads.map(({ src, srcSet }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      if (srcSet) {
        link.imageSrcset = srcSet;
        link.imageSizes = '(max-width: 680px) 220px, 300px';
      }
      document.head.appendChild(link);
      return link;
    });

    preloads.forEach(({ src, srcSet }) => {
        const image = new Image();
        image.decoding = 'async';
        image.fetchPriority = 'high';
        if (srcSet) {
          image.srcset = srcSet;
          image.sizes = '(max-width: 680px) 220px, 300px';
        }
        image.src = src;
      });

    return () => links.forEach(link => link.remove());
  }, [isReferenceDemo, order]);

  const handleSplashDismiss = () => {
    if (shouldPlayMusic && audioRef.current) {
      audioRef.current.volume = 0.52;
      audioRef.current.play().catch(() => undefined);
    }
    setShowSplash(false);
  };

  const handleRsvp = async (event) => {
    event.preventDefault();
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

  const embedSrc = mapEnabled ? buildMapEmbedUrl(wd.venueMapUrl, [venue, venueAddress].filter(Boolean).join(', ')) : null;
  const openMapHref = wd.venueMapUrl
    ? wd.venueMapUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, venueAddress].filter(Boolean).join(', '))}`;

  return (
    <div className="coastal-theme">
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && (
        <CoastalSplash onDismiss={handleSplashDismiss} />
      )}

      <section className="coastal-hero">
        <div className="coastal-hero-bg" aria-hidden>
          <img src={ceremonyArch} alt="" />
          <div className="coastal-hero-bg-wash" />
        </div>

        <motion.article
          className="coastal-hero-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        >
          <span className="coastal-kicker">Please join us to</span>
          <span className="coastal-kicker coastal-kicker-thin">celebrate the marriage of</span>

          <h1>
            <span className="coastal-hero-name">{name1}</span>
            <span className="coastal-hero-amp">&amp;</span>
            <span className="coastal-hero-name">{name2}</span>
          </h1>

          <FlourishSvg className="coastal-hero-flourish" />

          {weddingDate ? (
            <div className="coastal-hero-datepill">
              <div>
                <small>{dayStr ? dayStr.slice(0, 3).toUpperCase() : 'Day'}</small>
              </div>
              <span aria-hidden />
              <div className="coastal-hero-datepill-month">
                <small>{monthStr || 'Month'}</small>
                <strong>{dayOfMonth || '—'}</strong>
              </div>
              <span aria-hidden />
              <div>
                <small>{timeStr || 'Time'}</small>
              </div>
            </div>
          ) : null}

          <p className="coastal-hero-venue">{venue || 'By the sea'}</p>

          {message && <p className="coastal-hero-message">"{message}"</p>}
        </motion.article>
      </section>

      {weddingDate && (
        <section className="coastal-countdown coastal-section-denim">
          <SectionTitle eyebrow="Save The Date" title="Counting The Moments" light />
          <div className="coastal-count-grid">
            <CountdownUnit value={pad(timeLeft.days)} label="Days" />
            <CountdownUnit value={pad(timeLeft.hours)} label="Hours" />
            <CountdownUnit value={pad(timeLeft.minutes)} label="Minutes" />
            <CountdownUnit value={pad(timeLeft.seconds)} label="Seconds" />
          </div>
          <AnimatedBoat />
        </section>
      )}

      {!isReferenceDemo && couplePhotos.length > 0 && (
        <section className="coastal-section coastal-couple-section">
          <SectionTitle eyebrow="The couple" title="A Love" script="In Full Tide" />
          <div className="coastal-couple-grid">
            {couplePhotos.map((photo, index) => (
              <motion.figure
                key={index}
                className="coastal-photo-frame coastal-couple-photo"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <InvitationPhoto src={photo.url} alt={`Couple ${index + 1}`} sizes="(max-width: 768px) 80vw, 320px" />
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {isReferenceDemo && order.storyMilestones?.length ? (
        <StorySection milestones={order.storyMilestones} images={order.storyImages || []} />
      ) : storyPhotos.length > 0 ? (
        <StorySection milestones={order.storyMilestones || []} images={storyPhotos.map(photo => photo.url)} />
      ) : null}

      <section className="coastal-section coastal-event-section">
        <SectionTitle eyebrow="The Big Day" title="Ceremony" script="& Reception" />
        <div className="coastal-event-layout">
          <motion.div
            className="coastal-event-card"
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="coastal-kicker">{tideCode}</span>
            <h3>{venue || 'The Shoreline'}</h3>
            <dl>
              <div>
                <dt>Date</dt>
                <dd>{fullDateStr || 'To be announced'}</dd>
              </div>
              {timeStr && (
                <div>
                  <dt>Time</dt>
                  <dd>{timeStr}</dd>
                </div>
              )}
              {venueAddress && (
                <div>
                  <dt>Address</dt>
                  <dd>{venueAddress}</dd>
                </div>
              )}
            </dl>
            {embedSrc && (
              <div className="coastal-map">
                <iframe src={embedSrc} title="Venue location" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <a href={openMapHref} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" />
              </div>
            )}
          </motion.div>

          <motion.div
            className="coastal-event-art"
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <img src={ceremonyArch} alt="" />
          </motion.div>
        </div>

        {!isReferenceDemo && venuePhotos.length > 0 && (
          <div className="coastal-venue-grid">
            {venuePhotos.map((photo, index) => (
              <figure key={index} className="coastal-photo-frame">
                <InvitationPhoto src={photo.url} alt={`Venue ${index + 1}`} sizes="(max-width: 768px) 80vw, 320px" />
              </figure>
            ))}
          </div>
        )}
      </section>

      {rsvpEnabled && (
      <section className="coastal-rsvp-section">
        <div className="coastal-rsvp-ocean" aria-hidden>
          <span className="coastal-rsvp-foam coastal-rsvp-foam-one" />
          <span className="coastal-rsvp-foam coastal-rsvp-foam-two" />
          <BlueShellMark className="coastal-rsvp-watermark" />
        </div>
        <div className="coastal-rsvp-inner">
          <div className="coastal-rsvp-intro">
            <BlueShellMark className="coastal-rsvp-shell-mark" />
            <span className="coastal-rsvp-eyebrow">RSVP</span>
            <h2 className="coastal-rsvp-title">Kindly Respond</h2>
            <p className="coastal-rsvp-lead">
              We can't wait to celebrate with you. Please let us know by replying below.
            </p>
            <div className="coastal-rsvp-tide-card" aria-label="Wedding details">
              <span>{fullDateStr || 'Date to be announced'}</span>
              <strong>{venue || 'By the sea'}</strong>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!rsvpSubmitted ? (
              <motion.form
                key="rsvp-form"
                onSubmit={handleRsvp}
                className="coastal-rsvp-card"
                exit={{ opacity: 0, y: -20 }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="coastal-rsvp-grid">
                  <div className="coastal-field coastal-field-full">
                    <label htmlFor="rsvp-name">Full name</label>
                    <input
                      id="rsvp-name"
                      type="text"
                      required
                      value={rsvpForm.guestName}
                      onChange={event => setRsvpForm({ ...rsvpForm, guestName: event.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="coastal-field">
                    <label htmlFor="rsvp-guests">Guests</label>
                    <input
                      id="rsvp-guests"
                      type="number"
                      min={1}
                      max={10}
                      value={rsvpForm.guestCount}
                      onChange={event => setRsvpForm({ ...rsvpForm, guestCount: parseInt(event.target.value) || 1 })}
                    />
                  </div>

                  <div className="coastal-field coastal-field-attending">
                    <label>Will you attend?</label>
                    <div className="coastal-rsvp-toggle" role="radiogroup" aria-label="Will you attend?">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={rsvpForm.attending === 'yes'}
                        className={rsvpForm.attending === 'yes' ? 'active' : ''}
                        onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}
                      >
                        Joyfully accept
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={rsvpForm.attending === 'no'}
                        className={rsvpForm.attending === 'no' ? 'active' : ''}
                        onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}
                      >
                        Regretfully decline
                      </button>
                    </div>
                  </div>

                  <div className="coastal-field coastal-field-full">
                    <label htmlFor="rsvp-message">Message <span className="coastal-field-optional">(optional)</span></label>
                    <textarea
                      id="rsvp-message"
                      rows={4}
                      value={rsvpForm.message}
                      onChange={event => setRsvpForm({ ...rsvpForm, message: event.target.value })}
                      placeholder="Share a wish, a memory, or a song request…"
                    />
                  </div>
                </div>

                {rsvpError && <p className="coastal-rsvp-error">{rsvpError}</p>}
                <button type="submit" className="coastal-submit">
                  <span>Send Response</span>
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="rsvp-success"
                className="coastal-rsvp-card coastal-rsvp-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                <BlueShellMark className="coastal-rsvp-success-shell" />
                <span>Response received</span>
                <h3>Thank you, {rsvpForm.guestName}</h3>
                <p>Your reply has been sent to the couple. We can't wait to celebrate together.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      )}

      {isReferenceDemo && order.galleryImages?.length ? (
        <GallerySection images={order.galleryImages} />
      ) : allGallery.length > 0 ? (
        <GallerySection images={allGallery.map(photo => photo.url)} />
      ) : null}

      <footer className="coastal-footer">
        <div className="coastal-footer-foam" aria-hidden />
        <div className="coastal-footer-inner">
          <BlueShellMark className="coastal-footer-shell" />
          <p className="coastal-footer-script">with love</p>
          <h2 className="coastal-footer-names">
            {name1} <span className="coastal-footer-amp">&amp;</span> {name2}
          </h2>
          <div className="coastal-footer-rule" aria-hidden />
          <p className="coastal-footer-meta-line">
            Thank you for being part of our beginning
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, script, light = false }) {
  return (
    <div className={`coastal-section-title${light ? ' coastal-section-title-light' : ''}`}>
      <span>{eyebrow}</span>
      <h2>
        {title}
        {script && <span className="script">{script}</span>}
      </h2>
      <FlourishSvg className="coastal-section-divider" />
    </div>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="coastal-count-unit">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StorySection({ milestones, images }) {
  const items = images.length
    ? images.map((src, index) => ({ src, ...(milestones[index] || {}) }))
    : milestones.map((milestone) => ({ ...milestone, src: ceremonyArch }));

  return (
    <section className="coastal-section coastal-story-section">
      <SectionTitle eyebrow="Our story" title="The Route" script="Of Us" />
      <div className="coastal-story-list">
        {items.map((item, index) => (
          <motion.article
            key={index}
            className="coastal-story-item"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
          >
            <motion.figure
              className="coastal-photo-frame"
              initial={{ opacity: 0, x: index % 2 === 0 ? -42 : 42 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: index * 0.1 + 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <InvitationPhoto src={item.src} alt={item.title || `Story ${index + 1}`} sizes="(max-width: 768px) 80vw, 280px" />
            </motion.figure>
            <div>
              {item.date && <span>{item.date}</span>}
              <h3>{item.title || `Chapter ${index + 1}`}</h3>
              {item.description && <p>{item.description}</p>}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ images }) {
  const uniqueImages = [...new Set(images.filter(Boolean))];
  const galleryImageKey = uniqueImages.join('|');
  const galleryRowRef = useRef(null);
  const galleryUnitRef = useRef(null);
  // Repeat images enough times to fill at least 2x the viewport for seamless looping
  const unitRepeatCount = uniqueImages.length ? Math.max(3, Math.ceil(12 / uniqueImages.length)) : 0;
  const unitImages = uniqueImages.length
    ? Array.from({ length: unitRepeatCount }, () => uniqueImages).flat()
    : [];

  useEffect(() => {
    const row = galleryRowRef.current;
    const unit = galleryUnitRef.current;
    if (!row || !unit || !unitImages.length || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let distance = 0;
    let offset = 0;
    let previousTime = 0;
    // Slower speed for smoother effect and iOS compatibility
    let pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 68 : 88;

    // Use scrollWidth for more accurate seamlessness on iOS
    const updateDistance = () => {
      // Always use scrollWidth for seamlessness
      distance = unit.scrollWidth;
      offset = distance ? offset % distance : 0;
      row.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const updateSpeed = () => {
      pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 28 : 36;
    };

    const animate = (time) => {
      if (!previousTime) previousTime = time;
      // Clamp to 0.04s for more consistent timing (esp. on iOS)
      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;

      if (distance > 0) {
        offset += pixelsPerSecond * elapsedSeconds;
        // Snap to 0 when reaching the end for seamless loop
        if (offset >= distance - 1) offset = 0;
        row.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      previousTime = 0;
      if (reducedMotion.matches) {
        row.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    updateDistance();
    updateSpeed();
    startAnimation();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateDistance)
      : null;

    resizeObserver?.observe(unit);
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', startAnimation);
    } else {
      reducedMotion.addListener(startAnimation);
    }
    window.addEventListener('resize', updateDistance);
    window.addEventListener('resize', updateSpeed);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (reducedMotion.removeEventListener) {
        reducedMotion.removeEventListener('change', startAnimation);
      } else {
        reducedMotion.removeListener(startAnimation);
      }
      window.removeEventListener('resize', updateDistance);
      window.removeEventListener('resize', updateSpeed);
    };
  }, [unitImages.length, galleryImageKey]);

  const renderGalleryGroup = (groupIndex) => unitImages.map((src, index) => {
    const imageNumber = (index % uniqueImages.length) + 1;

    return (
      <figure key={`${groupIndex}-${src}-${index}`} className="coastal-gallery-card">
        <InvitationPhoto
          src={src}
          sizes="(max-width: 680px) 220px, 300px"
          alt={`Memory ${imageNumber}`}
          loading="eager"
          fetchPriority={groupIndex === 0 && index < uniqueImages.length ? 'high' : 'auto'}
        />
      </figure>
    );
  });

  return (
    <section className="coastal-gallery-section">
      <div className="coastal-gallery-header">
        <h2>Memories</h2>
      </div>
      <div className="coastal-gallery-viewport">
        <div
          className={`coastal-gallery-row${unitImages.length ? ' coastal-gallery-row-loop' : ''}`}
          ref={galleryRowRef}
        >
          {[0, 1, 2, 3].map((groupIndex) => (
            <div
              key={groupIndex}
              ref={groupIndex === 0 ? galleryUnitRef : null}
              className="coastal-gallery-group"
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {renderGalleryGroup(groupIndex)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedBoat({ small = false }) {
  return (
    <div className={`coastal-boat-wrap${small ? ' coastal-boat-wrap-small' : ''}`} aria-hidden>
      <div className="coastal-boat">
        <img src={cruiseShip} alt="" />
      </div>
      <span className="coastal-boat-wake" />
    </div>
  );
}

function CoastalBirds({ compact = false }) {
  return (
    <div className={`coastal-main-birds${compact ? ' coastal-main-birds-compact' : ''}`} aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}
