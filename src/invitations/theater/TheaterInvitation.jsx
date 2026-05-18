import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import TheaterSplash from './TheaterSplash';
import './theater.css';
import { buildInvitationImageSources, formatInvitationTime, getInvitationPhotoSrc } from '../shared';
import InvitationPhoto from '../InvitationPhoto';

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
  <svg className={className} viewBox="0 0 120 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M2 8 H 46" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
    <path d="M74 8 H 118" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
    <path
      d="M60 2 L62.6 6.4 L67.4 7 L63.8 10.2 L64.8 15 L60 12.6 L55.2 15 L56.2 10.2 L52.6 7 L57.4 6.4 Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const StarMark = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M32 4 L37 24 L57 26 L41.5 38 L46 58 L32 47.5 L18 58 L22.5 38 L7 26 L27 24 Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const MarqueeBulbs = ({ count = 5 }) => (
  <div className="theater-marquee-bulbs" aria-hidden>
    {Array.from({ length: count }).map((_, i) => <span key={i} />)}
  </div>
);

export default function TheaterInvitation({ order, demo = false, publicSlug }) {
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
  const message = fieldEnabled('message') ? (wd.message || 'Tonight, the curtain rises on forever.') : '';
  const billingCode = wd.flightNo || `ACT-${weddingDate ? weddingDate.getFullYear() : '2026'}`;
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
        .map(photo => photo);

    const preloads = [...new Set(memorySources.map(getInvitationPhotoSrc).filter(Boolean))]
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
    <div className="theater-theme">
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && (
        <TheaterSplash onDismiss={handleSplashDismiss} />
      )}

      <section className="theater-hero">
        <span className="theater-hero-curtain theater-hero-curtain-left" aria-hidden />
        <span className="theater-hero-curtain theater-hero-curtain-right" aria-hidden />
        <div className="theater-hero-marquee" aria-hidden>
          <span>Velvet House</span>
          <span>Main Stage</span>
          <span>One Night Only</span>
        </div>
        <div className="theater-hero-spotlight" aria-hidden />
        <div className="theater-hero-sparks" aria-hidden>
          <span /><span /><span /><span /><span />
        </div>

        <motion.article
          className="theater-hero-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        >
          <span className="theater-kicker">Tonight's Performance</span>
          <span className="theater-kicker theater-kicker-thin">A wedding in one act</span>

          <MarqueeBulbs count={5} />
          <StarMark className="theater-hero-stage-mark" />

          <h1>
            <span className="theater-hero-name">{name1}</span>
            <span className="theater-hero-amp">&amp;</span>
            <span className="theater-hero-name">{name2}</span>
          </h1>

          <FlourishSvg className="theater-hero-flourish" />

          {weddingDate ? (
            <div className="theater-hero-datepill">
              <div>
                <small>{dayStr ? dayStr.slice(0, 3).toUpperCase() : 'Day'}</small>
              </div>
              <span aria-hidden />
              <div className="theater-hero-datepill-month">
                <small>{monthStr || 'Month'}</small>
                <strong>{dayOfMonth || '—'}</strong>
              </div>
              <span aria-hidden />
              <div>
                <small>{timeStr || 'Curtain'}</small>
              </div>
            </div>
          ) : null}

          <p className="theater-hero-venue">{venue || 'On The Velvet Stage'}</p>
          {venueAddress && <p className="theater-hero-address">{venueAddress}</p>}

          {message && <p className="theater-hero-message">{message}</p>}
        </motion.article>
      </section>

      {weddingDate && (
        <section className="theater-countdown theater-section-denim">
          <div className="theater-countdown-proscenium" aria-hidden />
          <SectionTitle eyebrow="Save The Date" title="Counting The Moments" light />
          <div className="theater-count-grid">
            <CountdownUnit value={pad(timeLeft.days)} label="Days" />
            <CountdownUnit value={pad(timeLeft.hours)} label="Hours" />
            <CountdownUnit value={pad(timeLeft.minutes)} label="Minutes" />
            <CountdownUnit value={pad(timeLeft.seconds)} label="Seconds" />
          </div>
          <StageMarquee />
        </section>
      )}

      {!isReferenceDemo && couplePhotos.length > 0 && (
        <section className="theater-section theater-couple-section">
          <SectionTitle eyebrow="The couple" title="A Love" script="Behind The Curtain" />
          <div className="theater-couple-grid">
            {couplePhotos.map((photo, index) => (
              <motion.figure
                key={index}
                className="theater-photo-frame theater-couple-photo"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              >
                <InvitationPhoto src={photo} alt={`Couple ${index + 1}`} sizes="(max-width: 768px) 80vw, 320px" />
              </motion.figure>
            ))}
          </div>
        </section>
      )}

      {isReferenceDemo && order.storyMilestones?.length ? (
        <StorySection milestones={order.storyMilestones} images={order.storyImages || []} />
      ) : storyPhotos.length > 0 ? (
        <StorySection milestones={order.storyMilestones || []} images={storyPhotos} />
      ) : null}

      <section className="theater-section theater-event-section">
        <SectionTitle eyebrow="The Big Day" title="Ceremony" script="& Reception" />
        <div className="theater-event-layout theater-event-layout-single">
          <motion.div
            className="theater-event-card"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="theater-kicker">{billingCode}</span>
            <h3>{venue || 'The Velvet Stage'}</h3>
            <dl>
              <div>
                <dt>Date</dt>
                <dd>{fullDateStr || 'To be announced'}</dd>
              </div>
              {timeStr && (
                <div>
                  <dt>Curtain</dt>
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
              <div className="theater-map">
                <iframe src={embedSrc} title="Venue location" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <a href={openMapHref} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" />
              </div>
            )}
          </motion.div>
        </div>

        {!isReferenceDemo && venuePhotos.length > 0 && (
          <div className="theater-venue-grid">
            {venuePhotos.map((photo, index) => (
              <figure key={index} className="theater-photo-frame">
                <InvitationPhoto src={photo} alt={`Venue ${index + 1}`} sizes="(max-width: 768px) 80vw, 320px" />
              </figure>
            ))}
          </div>
        )}
      </section>

      {rsvpEnabled && (
      <section className="theater-rsvp-section">
        <div className="theater-rsvp-ocean" aria-hidden>
          <span className="theater-rsvp-foam theater-rsvp-foam-one" />
          <span className="theater-rsvp-foam theater-rsvp-foam-two" />
        </div>
        <div className="theater-rsvp-inner">
          <div className="theater-rsvp-intro">
            <MarqueeBulbs count={5} />
            <span className="theater-rsvp-eyebrow">RSVP</span>
            <h2 className="theater-rsvp-title">Take Your Seat</h2>
            <p className="theater-rsvp-lead">
              The stage is set and the curtain awaits - please let us know you'll be there.
            </p>
            <div className="theater-rsvp-tide-card" aria-label="Wedding details">
              <span>{fullDateStr || 'Date to be announced'}</span>
              <strong>{venue || 'On The Velvet Stage'}</strong>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!rsvpSubmitted ? (
              <motion.form
                key="rsvp-form"
                onSubmit={handleRsvp}
                className="theater-rsvp-card"
                exit={{ opacity: 0, y: -20 }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
              >
                <div className="theater-rsvp-grid">
                  <div className="theater-field theater-field-full">
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

                  <div className="theater-field">
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

                  <div className="theater-field theater-field-attending">
                    <label>Will you attend?</label>
                    <div className="theater-rsvp-toggle" role="radiogroup" aria-label="Will you attend?">
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

                  <div className="theater-field theater-field-full">
                    <label htmlFor="rsvp-message">Message <span className="theater-field-optional">(optional)</span></label>
                    <textarea
                      id="rsvp-message"
                      rows={4}
                      value={rsvpForm.message}
                      onChange={event => setRsvpForm({ ...rsvpForm, message: event.target.value })}
                      placeholder="Share a wish, a memory, or a song request..."
                    />
                  </div>
                </div>

                {rsvpError && <p className="theater-rsvp-error">{rsvpError}</p>}
                <button type="submit" className="theater-submit">
                  <span>Send Response</span>
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="rsvp-success"
                className="theater-rsvp-card theater-rsvp-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                <MarqueeBulbs count={5} />
                <span>Response received</span>
                <h3>Thank you, {rsvpForm.guestName}</h3>
                <p>Your reply has been sent to the couple. The spotlight will be waiting.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      )}

      {isReferenceDemo && order.galleryImages?.length ? (
        <GallerySection images={order.galleryImages} />
      ) : allGallery.length > 0 ? (
        <GallerySection images={allGallery} />
      ) : null}

      <footer className="theater-footer">
        <div className="theater-footer-foam" aria-hidden />
        <div className="theater-footer-inner">
          <FlourishSvg className="theater-footer-shell" />
          <p className="theater-footer-script">with love</p>
          <h2 className="theater-footer-names">
            {name1} <span className="theater-footer-amp">&amp;</span> {name2}
          </h2>
          <div className="theater-footer-rule" aria-hidden />
          <p className="theater-footer-meta-line">
            Thank you for being part of our opening night
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, script, light = false }) {
  return (
    <div className={`theater-section-title${light ? ' theater-section-title-light' : ''}`}>
      <span>{eyebrow}</span>
      <h2>
        {title}
        {script && <span className="script">{script}</span>}
      </h2>
      <FlourishSvg className="theater-section-divider" />
    </div>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="theater-count-unit">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StorySection({ milestones, images }) {
  const items = images.length
    ? images.map((src, index) => ({ src, ...(milestones[index] || {}) }))
    : milestones.map((milestone) => ({ ...milestone, src: null }));

  return (
    <section className="theater-section theater-story-section">
      <SectionTitle eyebrow="Our story" title="The Acts" script="Of Us" />
      <div className="theater-story-list">
        {items.map((item, index) => (
          <motion.article
            key={index}
            className="theater-story-item"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
          >
            <motion.figure
              className="theater-photo-frame"
              initial={{ opacity: 0, x: index % 2 === 0 ? -42 : 42 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: index * 0.1 + 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {item.src ? (
                <InvitationPhoto src={item.src} alt={item.title || `Story ${index + 1}`} sizes="(max-width: 768px) 80vw, 280px" />
              ) : (
                <div className="theater-story-placeholder" aria-hidden>
                  <StarMark />
                </div>
              )}
            </motion.figure>
            {(item.date || item.title || item.description) && (
              <div>
                {item.date && <span>{item.date}</span>}
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ images }) {
  const uniqueImages = images.filter((image, index, allImages) => {
    const src = getInvitationPhotoSrc(image);
    return src && allImages.findIndex(candidate => getInvitationPhotoSrc(candidate) === src) === index;
  });
  const galleryImageKey = uniqueImages.map(getInvitationPhotoSrc).join('|');
  const galleryRowRef = useRef(null);
  const galleryUnitRef = useRef(null);
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
    let pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 68 : 88;

    const updateDistance = () => {
      distance = unit.scrollWidth;
      offset = distance ? offset % distance : 0;
      row.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const updateSpeed = () => {
      pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 28 : 36;
    };

    const animate = (time) => {
      if (!previousTime) previousTime = time;
      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;

      if (distance > 0) {
        offset += pixelsPerSecond * elapsedSeconds;
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
    const imageSrc = getInvitationPhotoSrc(src);

    return (
      <figure key={`${groupIndex}-${imageSrc}-${index}`} className="theater-gallery-card">
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
    <section className="theater-gallery-section">
      <div className="theater-gallery-header">
        <h2>Memories</h2>
      </div>
      <div className="theater-gallery-viewport">
        <div
          className={`theater-gallery-row${unitImages.length ? ' theater-gallery-row-loop' : ''}`}
          ref={galleryRowRef}
        >
          {[0, 1, 2, 3].map((groupIndex) => (
            <div
              key={groupIndex}
              ref={groupIndex === 0 ? galleryUnitRef : null}
              className="theater-gallery-group"
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

function StageMarquee() {
  return (
    <div className="theater-marquee-wrap" aria-hidden>
      <span className="theater-marquee-rule" />
      <MarqueeBulbs count={9} />
      <span className="theater-marquee-rule" />
    </div>
  );
}
