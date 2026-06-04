import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import FountainSplash from './FountainSplash';
import FountainEnvelopeSplash from './FountainEnvelopeSplash';
import FountainHeroText from './FountainHeroText';
import './fountain-reverie.css';
import { buildInvitationImageSources, containInvitationPhoto, createRsvpSubmissionId, DEFAULT_COUPLE_MESSAGE, getGuestPolicyLines, getInvitationPhotoSrc } from '../shared';
import GuestNote from '../GuestNote';
import { getInvitationFontStyle } from '../fontOptions';
import { getTieredInvitationPhotos, getTieredStoryMilestones, invitationTierAllows } from '../tierAccess';
import InvitationPhoto from '../InvitationPhoto';
import useHeroScrollReset from '../useHeroScrollReset';
import sectionSeparator from '../../assets/Fountain Reverie/decorative_components/elegant_vintage_ornamental_flourish_transparent.png';
import envelopeMessage from '../../assets/Fountain Reverie/envelope_message.png';

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

function formatHeroTime(value, preference = '12h') {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (preference === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function getTimeOfDayLine(value) {
  const raw = `${value || ''}`.trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return '';

  let hours = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (hours < 12) return 'IN THE MORNING';
  if (hours < 17) return 'IN THE AFTERNOON';
  return 'IN THE EVENING';
}

function formatWeddingDateParts(date) {
  if (!date) return { weekday: '', full: '', dayMonthYear: '', month: '', day: '' };
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
    full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    dayMonthYear: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate(),
  };
}

const Crest = ({ initials }) => (
  <div className="fountain-crest" aria-hidden>
    <svg className="fountain-crest-frame" viewBox="0 0 170 118" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M85 7C103 23 122 21 129 45C137 73 114 98 85 103C56 98 33 73 41 45C48 21 67 23 85 7Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M27 80C45 64 62 72 85 90C108 72 125 64 143 80" stroke="currentColor" strokeWidth="1.2" />
      <path d="M19 88C39 88 46 96 64 96" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M151 88C131 88 124 96 106 96" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M85 1L90 11L101 12L92 19L95 30L85 24L75 30L78 19L69 12L80 11L85 1Z" stroke="currentColor" strokeWidth="1" />
      <path d="M85 100L90 108L99 109L92 115L94 124L85 119L76 124L78 115L71 109L80 108L85 100Z" stroke="currentColor" strokeWidth="1" />
    </svg>
    <span>{initials[0] || 'A'}</span>
    <i aria-hidden />
    <span>{initials[1] || 'Z'}</span>
  </div>
);

export default function FountainReverieInvitation({ order, demo = false, publicSlug, heroImage, variant = 'v1' }) {
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);
  const rsvpSubmissionId = useRef(createRsvpSubmissionId());
  const rootRef = useHeroScrollReset(showSplash);

  const wd = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const mapEnabled = fieldEnabled('venueMapUrl');
  const rsvpEnabled = fieldEnabled('rsvp') && invitationTierAllows(order, 'rsvp');
  const name1 = wd.groomName || 'Partner 1';
  const name2 = wd.brideName || 'Partner 2';
  const weddingDate = wd.weddingDate ? new Date(wd.weddingDate) : null;
  const dateParts = formatWeddingDateParts(weddingDate);
  const timeStr = fieldEnabled('weddingTime') ? formatHeroTime(wd.weddingTime, wd.timeFormat) : '';
  const timeOfDay = fieldEnabled('weddingTime') ? getTimeOfDayLine(wd.weddingTime) : '';
  const venue = wd.venue || '';
  const venueAddress = '';
  const coupleMessage = fieldEnabled('coupleMessage')
    ? (order.coupleMessage !== undefined && order.coupleMessage !== null
      ? order.coupleMessage
      : ((demo ? DEFAULT_COUPLE_MESSAGE : wd.message) || DEFAULT_COUPLE_MESSAGE))
    : '';
  const guestPolicyLines = getGuestPolicyLines(wd, disabledFields);
  const shouldPlayMusic = invitationTierAllows(order, 'music') && Boolean(order.musicUrl && order.musicEnabled !== false);
  const isReferenceDemo = Boolean(demo && order.referenceLayout);
  const useEnvelopeSplash = variant === 'v1';
  const initials = `${name1[0] || 'A'}${name2[0] || 'Z'}`.toUpperCase();
  const pad = (n) => n.toString().padStart(2, '0');

  const allPhotos = getTieredInvitationPhotos(order);
  const storyMilestones = getTieredStoryMilestones(order);
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
      : allPhotos
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
        body: JSON.stringify({ ...rsvpForm, submissionId: rsvpSubmissionId.current }),
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
    <div ref={rootRef} className={`fountain-theme fountain-theme-${variant}${showSplash && !splashReady ? ' invitation-splash-gated' : ''}`} style={getInvitationFontStyle(order)}>
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && (
        useEnvelopeSplash ? (
          <FountainEnvelopeSplash onReady={() => setSplashReady(true)} onDismiss={handleSplashDismiss} />
        ) : (
          <FountainSplash onReady={() => setSplashReady(true)} onDismiss={handleSplashDismiss} />
        )
      )}

      <section className="fountain-hero">
        <div className="fountain-hero-art">
          <img className="fountain-hero-image" src={heroImage} alt="" aria-hidden="true" />
          <motion.article
            className="fountain-hero-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          >
            <FountainHeroText
              firstInitial={initials[0] || 'A'}
              secondInitial={initials[1] || 'Z'}
              bride={name1}
              groom={name2}
              day={dateParts.weekday || 'SATURDAY'}
              date={dateParts.dayMonthYear || '24 MAY 2025'}
              time={timeStr ? `AT ${timeStr}` : 'AT 5:30 PM'}
              timeNote={timeOfDay || 'IN THE EVENING'}
              venue={(venue || 'THE GARDEN PAVILION').toUpperCase()}
              address1=""
              address2=""
            />
          </motion.article>
        </div>
      </section>

      {weddingDate && (
        <>
          <section className="fountain-countdown">
            <SectionTitle title="Countdown" />
            <div className="fountain-count-grid">
              <CountdownUnit value={pad(timeLeft.days)} label="Days" />
              <CountdownUnit value={pad(timeLeft.hours)} label="Hours" />
              <CountdownUnit value={pad(timeLeft.minutes)} label="Minutes" />
              <CountdownUnit value={pad(timeLeft.seconds)} label="Seconds" />
            </div>
          </section>
        </>
      )}

      {!isReferenceDemo && couplePhotos.length > 0 && (
        <>
          <section className="fountain-section fountain-couple-section">
            <SectionTitle title="Couple" />
            <div className="fountain-couple-grid">
              {couplePhotos.map((photo, index) => (
                <motion.figure
                  key={index}
                  className="fountain-photo-frame fountain-couple-photo"
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
        </>
      )}

      {isReferenceDemo && storyMilestones.length ? (
        <StorySection milestones={storyMilestones} images={order.storyImages || []} />
      ) : storyPhotos.length > 0 ? (
        <StorySection milestones={storyMilestones} images={storyPhotos} />
      ) : null}

      <section className="fountain-section fountain-event-section">
        <SectionTitle title="Details" />
        <div className="fountain-event-layout">
          <motion.div
            className="fountain-event-card"
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <dl>
              {venue && (
                <div>
                  <dt>Venue</dt>
                  <dd>{venue}</dd>
                </div>
              )}
              <div>
                <dt>Date</dt>
                <dd>{dateParts.full || 'To be announced'}</dd>
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
            <GuestNote lines={guestPolicyLines} className="fountain-details-policy" />
            {embedSrc && (
              <div className="fountain-map">
                <iframe src={embedSrc} title="Venue location" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <a href={openMapHref} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" />
              </div>
            )}
          </motion.div>

        </div>

        {!isReferenceDemo && venuePhotos.length > 0 && (
          <div className="fountain-venue-grid">
            {venuePhotos.map((photo, index) => (
              <figure key={index} className="fountain-photo-frame">
                <InvitationPhoto src={photo} alt={`Venue ${index + 1}`} sizes="(max-width: 768px) 80vw, 320px" />
              </figure>
            ))}
          </div>
        )}
      </section>

      {coupleMessage && <CoupleMessageSection message={coupleMessage} />}

      {rsvpEnabled && (
        <>
          <section className="fountain-rsvp-section">
            <div className="fountain-rsvp-panel">
              <div className="fountain-rsvp-panel-header">
                <img className="fountain-rsvp-panel-ornament" src={sectionSeparator} alt="" aria-hidden="true" />
                <h2>RSVP</h2>
                <strong>Kindly Respond</strong>
                <p>We cannot wait to celebrate with you.<br />Please let us know by replying below.</p>
              </div>
              <AnimatePresence mode="wait">
                {!rsvpSubmitted ? (
                  <motion.form
                    key="rsvp-form"
                    onSubmit={handleRsvp}
                    className="fountain-rsvp-panel-form"
                    exit={{ opacity: 0, y: -20 }}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                  >
                  <label className="fountain-rsvp-panel-field" htmlFor="fountain-rsvp-name">
                    <span>Full name</span>
                    <input
                      id="fountain-rsvp-name"
                      type="text"
                      required
                      value={rsvpForm.guestName}
                      onChange={event => setRsvpForm({ ...rsvpForm, guestName: event.target.value })}
                      placeholder="e.g. Olivia Rossi"
                    />
                  </label>
                    <fieldset className="fountain-rsvp-panel-choice">
                      <legend>Will you attend?</legend>
                      <div role="radiogroup" aria-label="Will you attend?">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={rsvpForm.attending === 'yes'}
                          className={rsvpForm.attending === 'yes' ? 'active' : ''}
                          onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}
                        >
                          <span>Joyfully</span>
                          <small>Accept</small>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={rsvpForm.attending === 'no'}
                          className={rsvpForm.attending === 'no' ? 'active' : ''}
                          onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}
                        >
                          <span>Regretfully</span>
                          <small>Decline</small>
                        </button>
                      </div>
                    </fieldset>
                    <label className="fountain-rsvp-panel-field" htmlFor="fountain-rsvp-message">
                      <span>Optional message</span>
                      <textarea
                        id="fountain-rsvp-message"
                        rows={3}
                        value={rsvpForm.message}
                        onChange={event => setRsvpForm({ ...rsvpForm, message: event.target.value })}
                        placeholder="Share any special notes or song requests..."
                      />
                    </label>
                    {rsvpError && <p className="fountain-rsvp-panel-error">{rsvpError}</p>}
                    <button type="submit" className="fountain-rsvp-panel-submit">
                      Send Response
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="rsvp-success"
                    className="fountain-rsvp-panel-success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                  >
                    <span>Response received</span>
                    <h3>Thank you, {rsvpForm.guestName}</h3>
                    <p>Your reply has been sent to the couple. We cannot wait to celebrate together.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </>
      )}

      {invitationTierAllows(order, 'gallery') && isReferenceDemo && order.galleryImages?.length ? (
        <GallerySection images={order.galleryImages} />
      ) : allGallery.length > 0 ? (
        <GallerySection images={allGallery} />
      ) : null}

      <footer className="fountain-footer">
        <div className="fountain-footer-inner">
          <p className="fountain-reception">with love</p>
          <h2>{name1} <span>&amp;</span> {name2}</h2>
          <p>Thank you for being part of our beginning</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="fountain-section-title">
      <img src={sectionSeparator} alt="" aria-hidden="true" />
      <h2>{title}</h2>
    </div>
  );
}

function CoupleMessageSection({ message }) {
  return (
    <section className="fountain-section fountain-message-section">
      <SectionTitle title="A Note" />
      <motion.div
        className="fountain-envelope"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <img className="fountain-envelope-image" src={envelopeMessage} alt="" aria-hidden="true" />
        <article className="fountain-envelope-copy">
          <span>From Our Hearts to Yours</span>
          <p>{message}</p>
        </article>
      </motion.div>
    </section>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="fountain-count-unit">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StorySection({ milestones, images }) {
  const items = images.length
    ? images.map((src, index) => ({ src, ...(milestones[index] || {}) }))
    : milestones.map((milestone) => ({ ...milestone, src: '' }));

  return (
    <>
      <section className="fountain-section fountain-story-section">
        <SectionTitle title="Story" />
        <div className="fountain-story-grid">
        {items.map((item, index) => (
          <motion.article
            key={index}
            className="fountain-story-card"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {item.src && (
              <figure className="fountain-photo-frame fountain-story-photo">
                <InvitationPhoto src={containInvitationPhoto(item.src)} alt={item.title || `Story ${index + 1}`} sizes="(max-width: 768px) 90vw, 380px" />
              </figure>
            )}
            {(item.date || item.title || item.description) && (
              <div className="fountain-story-text">
                {item.date && <span>{item.date}</span>}
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </div>
            )}
          </motion.article>
        ))}
        </div>
      </section>
    </>
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
    const viewport = row.parentElement;
    let animationFrame = 0;
    let distance = 0;
    let offset = 0;
    let previousTime = 0;
    let isInteracting = false;
    let pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 34 : 44;

    const wrapOffset = (value) => {
      if (!distance) return 0;
      return ((value % distance) + distance) % distance;
    };

    const applyOffset = (value) => {
      offset = wrapOffset(value);
      row.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const updateDistance = () => {
      distance = unit.scrollWidth;
      applyOffset(offset);
    };

    const updateSpeed = () => {
      pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 34 : 44;
    };

    const animate = (time) => {
      if (!previousTime) previousTime = time;
      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;

      if (!isInteracting && distance > 0) {
        applyOffset(offset + pixelsPerSecond * elapsedSeconds);
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
    // requestAnimationFrame is suspended while the tab/page is hidden. When the
    // page becomes visible again, restart the loop (and clear any stuck
    // interaction state) so the marquee always keeps looping infinitely.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        isInteracting = false;
        startAnimation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    let resumeTimer = 0;
    let pointerActive = false;
    let pointerStartX = 0;
    let pointerStartOffset = 0;
    const pause = () => {
      isInteracting = true;
      window.clearTimeout(resumeTimer);
    };
    const resumeSoon = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        previousTime = 0;
        isInteracting = false;
      }, 700);
    };
    const handlePointerDown = (event) => {
      if (!distance) return;
      pointerActive = true;
      pointerStartX = event.clientX;
      pointerStartOffset = offset;
      pause();
      viewport?.setPointerCapture?.(event.pointerId);
    };
    const handlePointerMove = (event) => {
      if (!pointerActive) return;
      event.preventDefault();
      applyOffset(pointerStartOffset - (event.clientX - pointerStartX));
    };
    const handlePointerEnd = (event) => {
      if (!pointerActive) return;
      pointerActive = false;
      viewport?.releasePointerCapture?.(event.pointerId);
      resumeSoon();
    };
    const handleWheel = (event) => {
      const delta = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
        ? event.deltaX
        : (event.shiftKey ? event.deltaY : 0);
      if (!delta || !distance) return;
      event.preventDefault();
      pause();
      applyOffset(offset + delta);
      resumeSoon();
    };
    viewport?.addEventListener('pointerdown', handlePointerDown);
    viewport?.addEventListener('pointermove', handlePointerMove);
    viewport?.addEventListener('pointerup', handlePointerEnd);
    viewport?.addEventListener('pointercancel', handlePointerEnd);
    viewport?.addEventListener('pointerleave', handlePointerEnd);
    viewport?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(resumeTimer);
      resizeObserver?.disconnect();
      if (reducedMotion.removeEventListener) {
        reducedMotion.removeEventListener('change', startAnimation);
      } else {
        reducedMotion.removeListener(startAnimation);
      }
      window.removeEventListener('resize', updateDistance);
      window.removeEventListener('resize', updateSpeed);
      document.removeEventListener('visibilitychange', handleVisibility);
      viewport?.removeEventListener('pointerdown', handlePointerDown);
      viewport?.removeEventListener('pointermove', handlePointerMove);
      viewport?.removeEventListener('pointerup', handlePointerEnd);
      viewport?.removeEventListener('pointercancel', handlePointerEnd);
      viewport?.removeEventListener('pointerleave', handlePointerEnd);
      viewport?.removeEventListener('wheel', handleWheel);
    };
  }, [unitImages.length, galleryImageKey]);

  const renderGalleryGroup = (groupIndex) => unitImages.map((src, index) => {
    const imageNumber = (index % uniqueImages.length) + 1;
    const imageSrc = getInvitationPhotoSrc(src);

    return (
      <figure key={`${groupIndex}-${imageSrc}-${index}`} className="fountain-gallery-card">
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
    <>
      <section className="fountain-gallery-section">
        <SectionTitle title="Memories" />
        <div className="fountain-gallery-viewport">
        <div
          className={`fountain-gallery-row${unitImages.length ? ' fountain-gallery-row-loop' : ''}`}
          ref={galleryRowRef}
        >
          {[0, 1, 2, 3].map((groupIndex) => (
            <div
              key={groupIndex}
              ref={groupIndex === 0 ? galleryUnitRef : null}
              className="fountain-gallery-group"
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {renderGalleryGroup(groupIndex)}
            </div>
          ))}
        </div>
        </div>
      </section>
    </>
  );
}
