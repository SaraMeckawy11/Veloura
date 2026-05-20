import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import TheaterSplash from './TheaterSplash';
import './theater.css';
import './theater-components.css';
import './theater-final.css';
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
  const monthYearStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
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
  const storyPhotos = allPhotos.filter(p => p.label === 'story');
  const galleryPhotos = allPhotos.filter(p => p.label === 'gallery');
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
  const gallerySources = isReferenceDemo && order.galleryImages?.length ? order.galleryImages : allGallery;
  const storySources = isReferenceDemo && order.storyImages?.length ? order.storyImages : storyPhotos;
  const storyMilestones = isReferenceDemo && order.storyMilestones?.length ? order.storyMilestones : (order.storyMilestones || []);
  const storyItemCount = Math.min(4, Math.max(storySources.length, storyMilestones.length));
  const storyItems = Array.from({ length: storyItemCount }, (_, index) => ({
    image: storySources[index],
    ...(storyMilestones[index] || {}),
  })).filter(item => item.image || item.date || item.title || item.description || item.body);

  return (
    <div className="theater-theme">
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && (
        <TheaterSplash onDismiss={handleSplashDismiss} />
      )}

      <TheaterReferenceExperience
        name1={name1}
        name2={name2}
        dayStr={dayStr}
        monthStr={monthStr}
        monthYearStr={monthYearStr}
        dayOfMonth={dayOfMonth}
        fullDateStr={fullDateStr}
        timeStr={timeStr}
        venue={venue}
        venueAddress={venueAddress}
        message={message}
        weddingDate={weddingDate}
        billingCode={billingCode}
        embedSrc={embedSrc}
        openMapHref={openMapHref}
        storyItems={storyItems}
        gallerySources={gallerySources}
        timeLeft={timeLeft}
        pad={pad}
        rsvpEnabled={rsvpEnabled}
        rsvpForm={rsvpForm}
        setRsvpForm={setRsvpForm}
        rsvpSubmitted={rsvpSubmitted}
        rsvpError={rsvpError}
        handleRsvp={handleRsvp}
      />
    </div>
  );
}

function TheaterReferenceExperience({
  name1,
  name2,
  dayStr,
  monthStr,
  monthYearStr,
  dayOfMonth,
  fullDateStr,
  timeStr,
  venue,
  venueAddress,
  message,
  weddingDate,
  billingCode,
  embedSrc,
  openMapHref,
  storyItems,
  gallerySources,
  timeLeft,
  pad,
  rsvpEnabled,
  rsvpForm,
  setRsvpForm,
  rsvpSubmitted,
  rsvpError,
  handleRsvp,
}) {
  const countdown = [
    { label: 'Days', value: pad(timeLeft.days), icon: 'calendar' },
    { label: 'Hours', value: pad(timeLeft.hours), icon: 'clock' },
    { label: 'Minutes', value: pad(timeLeft.minutes), icon: 'hourglass' },
    { label: 'Seconds', value: pad(timeLeft.seconds), icon: 'stopwatch' },
  ];
  const ticketSerial = weddingDate
    ? `${String(weddingDate.getMonth() + 1).padStart(2, '0')}${String(weddingDate.getDate()).padStart(2, '0')}${weddingDate.getFullYear()}`
    : billingCode;

  return (
    <div className="theater-ref-experience">
      <ReferenceHero
        name1={name1}
        name2={name2}
        dayStr={dayStr}
        monthStr={monthStr}
        monthYearStr={monthYearStr}
        dayOfMonth={dayOfMonth}
        timeStr={timeStr}
        venue={venue}
        venueAddress={venueAddress}
        message={message}
        weddingDate={weddingDate}
        billingCode={billingCode}
        ticketSerial={ticketSerial}
      />

      {weddingDate && <ReferenceCountdown countdown={countdown} />}

      {storyItems.length > 0 && (
        <StorySection milestones={storyItems.map(item => ({ date: item.date, title: item.title, description: item.description || item.body }))} images={storyItems.map(item => item.image).filter(Boolean)} />
      )}

      <ReferenceDetails
        billingCode={billingCode}
        fullDateStr={fullDateStr}
        dayStr={dayStr}
        monthStr={monthStr}
        dayOfMonth={dayOfMonth}
        timeStr={timeStr}
        venue={venue}
        venueAddress={venueAddress}
        embedSrc={embedSrc}
        openMapHref={openMapHref}
      />

      {rsvpEnabled && (
        <ReferenceRsvp
          fullDateStr={fullDateStr}
          venue={venue}
          rsvpForm={rsvpForm}
          setRsvpForm={setRsvpForm}
          rsvpSubmitted={rsvpSubmitted}
          rsvpError={rsvpError}
          handleRsvp={handleRsvp}
        />
      )}

      {gallerySources.length > 0 && <GallerySection images={gallerySources} />}

      <ReferenceFinale name1={name1} name2={name2} />
    </div>
  );
}

function ReferenceHero({
  name1,
  name2,
  dayStr,
  monthYearStr,
  dayOfMonth,
  timeStr,
  venue,
  venueAddress,
  message,
  weddingDate,
  billingCode,
  ticketSerial,
}) {
  return (
    <section className="theater-ref-hero">
      <div className="theater-ref-stage" aria-hidden>
        <span className="theater-ref-stage-arch" />
        <span className="theater-ref-chandelier" />
        <span className="theater-ref-chandelier-glow" />
        <span className="theater-ref-rose theater-ref-rose-left" />
        <span className="theater-ref-rose theater-ref-rose-right" />
        <span className="theater-ref-curtain theater-ref-curtain-left" />
        <span className="theater-ref-curtain theater-ref-curtain-right" />
        <span className="theater-ref-footlights" />
      </div>
      <motion.article
        className="theater-ref-ticket theater-ref-hero-ticket"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <TicketCorners />
        <div className="theater-ref-mask" aria-hidden>
          <span />
          <span />
        </div>
        <p className="theater-ref-eyebrow">Together with their families</p>
        <div className="theater-ref-stars" aria-hidden>★ ★ ★</div>
        <h1>
          <span>{name1}</span>
          <em>&amp;</em>
          <span>{name2}</span>
        </h1>
        <p className="theater-ref-request">Request the honor of your presence at the premiere of their forever</p>
        {weddingDate && (
          <div className="theater-ref-hero-date">
            <span>{dayStr || 'Wedding Day'}</span>
            <strong>{dayOfMonth || ''}</strong>
            <span>{monthYearStr || ''}</span>
          </div>
        )}
        {timeStr && (
          <p className="theater-ref-doors">
            <span>{timeStr}</span>
          </p>
        )}
        <h2>{venue || 'The Royale Grand Theatre'}</h2>
        {venueAddress && <p className="theater-ref-hero-address">{venueAddress}</p>}
        {message && <p className="theater-ref-message">{message}</p>}
        <div className="theater-ref-admit">
          <small>{billingCode}</small>
          <span>Admit Two</span>
          <small>{ticketSerial || 'To a lifetime of encores'}</small>
        </div>
      </motion.article>
    </section>
  );
}

function ReferenceCountdown({ countdown }) {
  return (
    <ReferencePoster className="theater-ref-countdown" title="Countdown" subtitle="To the big day">
      <p className="theater-ref-section-lead">We can't wait to celebrate with you!</p>
      <Ornament />
      <div className="theater-ref-count-grid">
        {countdown.map(item => (
          <div className="theater-ref-count-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <i className={`theater-ref-count-icon theater-ref-count-icon-${item.icon}`} aria-hidden />
          </div>
        ))}
      </div>
      <p className="theater-ref-soon">See you soon!</p>
    </ReferencePoster>
  );
}

function ReferenceDetails({
  billingCode,
  fullDateStr,
  dayStr,
  monthStr,
  dayOfMonth,
  timeStr,
  venue,
  venueAddress,
  embedSrc,
  openMapHref,
}) {
  return (
    <ReferencePoster className="theater-ref-details" title="Details">
      <p className="theater-ref-section-lead">Here's everything you need to know to join us on our special day!</p>
      <Ornament />
      <div className="theater-ref-details-venue">
        <div className="theater-ref-round-icon theater-ref-round-icon-venue" aria-hidden />
        <div>
          <span>Venue</span>
          <h3>{venue || 'The Royale Grand Theatre'}</h3>
          {venueAddress && <p>{venueAddress}</p>}
        </div>
      </div>
      <div className="theater-ref-detail-row">
        <div className="theater-ref-detail-item">
          <i className="theater-ref-detail-icon-date" aria-hidden />
          <div>
            <span>Date</span>
            <strong>{dayStr || fullDateStr || 'To be announced'}</strong>
            <small>{dayOfMonth && monthStr ? `${dayOfMonth} ${monthStr}` : fullDateStr}</small>
          </div>
        </div>
        <div className="theater-ref-detail-item">
          <i className="theater-ref-detail-icon-time" aria-hidden />
          <div>
            <span>Time</span>
            <strong>{timeStr || 'To be announced'}</strong>
            <small>{billingCode}</small>
          </div>
        </div>
      </div>
      <div className="theater-ref-map-card">
        {embedSrc ? (
          <iframe src={embedSrc} title="Venue location" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <div className="theater-ref-map-fallback" aria-hidden />
        )}
        <div className="theater-ref-map-pin"><span>{venue || 'Venue'}</span></div>
        <a href={openMapHref} target="_blank" rel="noopener noreferrer">Open in maps</a>
      </div>
      <div className="theater-ref-dress">
        <span className="theater-ref-dress-masks" aria-hidden />
        <div>
          <strong>Dress Code</strong>
          <p>Black tie optional. Dress to impress.</p>
        </div>
        <em>Admit Two</em>
      </div>
    </ReferencePoster>
  );
}

function ReferenceRsvp({
  fullDateStr,
  venue,
  rsvpForm,
  setRsvpForm,
  rsvpSubmitted,
  rsvpError,
  handleRsvp,
}) {
  return (
    <section className="theater-ref-rsvp">
      <div className="theater-ref-rsvp-card">
        <MarqueeTitle title="RSVP" subtitle={`Kindly reply by ${fullDateStr || 'the wedding day'}`} />
        <p className="theater-ref-rsvp-date">
          <span>{fullDateStr || 'the wedding day'}</span>
        </p>
        <p className="theater-ref-section-lead">We can't wait to celebrate this special day with you!</p>
        <Ornament />
        <AnimatePresence mode="wait">
          {!rsvpSubmitted ? (
            <motion.form
              key="reference-rsvp-form"
              onSubmit={handleRsvp}
              className="theater-ref-rsvp-form"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45 }}
            >
              <label className="theater-ref-line-field">
                <span>Name</span>
                <input
                  type="text"
                  required
                  value={rsvpForm.guestName}
                  onChange={event => setRsvpForm({ ...rsvpForm, guestName: event.target.value })}
                />
              </label>
              <div className="theater-ref-rsvp-choice" role="radiogroup" aria-label="Will you attend?">
                <button
                  type="button"
                  role="radio"
                  aria-checked={rsvpForm.attending === 'yes'}
                  className={rsvpForm.attending === 'yes' ? 'active' : ''}
                  onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}
                >
                  <span />Accepts<small>with pleasure</small>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={rsvpForm.attending === 'no'}
                  className={rsvpForm.attending === 'no' ? 'active' : ''}
                  onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}
                >
                  <span />Declines<small>with regret</small>
                </button>
              </div>
              <label className="theater-ref-guests">
                <span>Number of guests attending</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rsvpForm.guestCount}
                  onChange={event => setRsvpForm({ ...rsvpForm, guestCount: parseInt(event.target.value) || 1 })}
                />
              </label>
              <label className="theater-ref-message-field">
                <strong>Song request</strong>
                <small>Share a song that will get you on the dance floor.</small>
                <textarea
                  rows={3}
                  value={rsvpForm.message}
                  onChange={event => setRsvpForm({ ...rsvpForm, message: event.target.value })}
                />
              </label>
              {rsvpError && <p className="theater-rsvp-error">{rsvpError}</p>}
              <button className="theater-ref-ticket-submit" type="submit">
                <span>Confirm your seat</span>
                <small>{venue || 'Through our wedding website'}</small>
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="reference-rsvp-success"
              className="theater-ref-rsvp-success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
            >
              <h3>Response received</h3>
              <p>Thank you, {rsvpForm.guestName}. Your seat is confirmed.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ReferenceFinale({ name1, name2 }) {
  return (
    <footer className="theater-ref-footer">
      <Ornament />
      <p>With love</p>
      <h2>{name1} <span>&amp;</span> {name2}</h2>
      <small>Thank you for being part of our opening night</small>
    </footer>
  );
}

function ReferencePoster({ className = '', title, subtitle, children }) {
  return (
    <section className={`theater-ref-poster ${className}`}>
      <span className="theater-ref-paper-texture" aria-hidden />
      <TicketCorners />
      <MarqueeTitle title={title} subtitle={subtitle} />
      {children}
    </section>
  );
}

function MarqueeTitle({ title, subtitle }) {
  return (
    <header className="theater-ref-marquee-title">
      <span className="theater-ref-marquee-crest" aria-hidden />
      <MarqueeBulbs count={13} />
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function Ornament() {
  return (
    <div className="theater-ref-ornament" aria-hidden>
      <span />
      <strong>★</strong>
      <span />
    </div>
  );
}

function TicketCorners() {
  return (
    <span className="theater-ref-ticket-corners" aria-hidden>
      <i /><i /><i /><i />
    </span>
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

