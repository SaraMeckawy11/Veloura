import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import GazeboSplash from './GazeboSplash';
import './gazebo-garden.css';

const API = import.meta.env.VITE_API_URL || '/api';
const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

const STORY_TONES = [
  'linear-gradient(135deg, #cdeefa, #fffaf0 48%, #f5c8c0)',
  'linear-gradient(135deg, #d9f2fb, #fffaf0 48%, #fff1b8)',
  'linear-gradient(135deg, #cdeefa, #fff7df 52%, #f6d5cf)',
  'linear-gradient(135deg, #fffaf2, #cdeefa 48%, #f0d0c8)',
];

const DEFAULT_STORY = [
  {
    date: 'Spring 2021',
    title: 'The First Hello',
    description: 'A quiet afternoon, a table by the window, and a conversation that somehow felt familiar from the very first minute.',
    imageLabel: 'Cafe light',
  },
  {
    date: 'Summer 2023',
    title: 'A City Became Ours',
    description: 'Weekend walks turned into a map of favorite corners, late dinners, old streets, and tiny rituals only they understood.',
    imageLabel: 'Old street',
  },
  {
    date: 'Winter 2025',
    title: 'The Question',
    description: 'Under soft lights and winter flowers, a yes arrived before the sentence was even finished.',
    imageLabel: 'Winter florals',
  },
];

const DEFAULT_GALLERY = [
  {
    title: 'Garden Light',
    caption: 'Soft greens and white petals',
    tone: 'linear-gradient(135deg, #cdeefa, #fffaf2 48%, #a8c98a)',
  },
  {
    title: 'The Promise',
    caption: 'A detail to remember',
    tone: 'linear-gradient(135deg, #d9f2fb, #fffaf0 48%, #d7a95d)',
  },
  {
    title: 'Dinner Glow',
    caption: 'Candles, linen, and laughter',
    tone: 'linear-gradient(135deg, #f5c8c0, #f5fbff 50%, #cdeefa)',
  },
  {
    title: 'White Bouquet',
    caption: 'Ivory florals gathered softly',
    tone: 'linear-gradient(135deg, #fffaf2, #cdeefa 48%, #f0d0c8)',
  },
  {
    title: 'The Venue',
    caption: 'A villa framed by evening sky',
    tone: 'linear-gradient(135deg, #cdeefa, #fff7df 52%, #d6b66a)',
  },
  {
    title: 'Last Dance',
    caption: 'A midnight memory',
    tone: 'linear-gradient(135deg, #d9f2fb, #fffaf2 54%, #95b874)',
  },
];

function buildMapEmbedUrl(rawUrl, fallbackQuery) {
  const url = (rawUrl || '').trim();
  if (url) {
    if (url.includes('/maps/embed') || url.includes('output=embed')) return url;
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

function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getGalleryPhotoUrl(photo) {
  return typeof photo === 'string' ? photo : photo?.url;
}

function buildOptimizedImageUrl(src, transform) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || !src.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return src;
  }

  const [prefix, rest] = src.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (!prefix || !rest || rest.startsWith(`${transform}/`)) return src;

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transform}/${rest}`;
}

function buildGalleryImageSources(src) {
  const mobile = buildOptimizedImageUrl(src, 'f_auto,q_auto:eco,c_fill,g_auto,w_520,h_700');
  const small = buildOptimizedImageUrl(src, 'f_auto,q_auto:eco,c_fill,g_auto,w_360,h_485');
  const large = buildOptimizedImageUrl(src, 'f_auto,q_auto:good,c_fill,g_auto,w_700,h_940');

  if (mobile === src) {
    return { src, srcSet: undefined };
  }

  return {
    src: mobile,
    srcSet: `${small} 360w, ${mobile} 520w, ${large} 700w`,
  };
}

export default function GazeboGardenInvitation({ order, demo = false, publicSlug }) {
  const [showSplash, setShowSplash] = useState(true);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({
    guestName: '',
    guestCount: '1',
    attending: '',
    message: '',
  });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);

  const wd = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const mapEnabled = !disabledFields.includes('venueMapUrl');
  const name1 = wd.groomName || 'Partner 1';
  const name2 = wd.brideName || 'Partner 2';
  const coupleNames = `${name1} & ${name2}`;
  const weddingDate = wd.weddingDate ? new Date(wd.weddingDate) : null;
  const fullDateStr = weddingDate ? formatDate(weddingDate) : '';
  const compactDateStr = weddingDate
    ? `${String(weddingDate.getMonth() + 1).padStart(2, '0')}.${String(weddingDate.getDate()).padStart(2, '0')}.${weddingDate.getFullYear()}`
    : '';
  const timeStr = wd.weddingTime || '';
  const venue = wd.venue || '';
  const venueAddress = wd.venueAddress || '';
  const message = wd.message || 'A garden promise sealed in soft light.';
  const heroDate = compactDateStr || fullDateStr;
  const fullDateTime = [fullDateStr, timeStr].filter(Boolean).join(' at ');
  const shouldPlayMusic = Boolean(order.musicUrl && order.musicEnabled !== false);
  const pad = (value) => String(value).padStart(2, '0');

  const orderPhotos = order.photos || [];
  const storyPhotos = orderPhotos.filter(photo => photo.label === 'story');
  const storySource = order.storyMilestones?.length ? order.storyMilestones : DEFAULT_STORY;
  const storyItems = storySource.map((item, index) => ({
    id: `${item.title || 'story'}-${index}`,
    date: item.date || DEFAULT_STORY[index % DEFAULT_STORY.length].date,
    title: item.title || DEFAULT_STORY[index % DEFAULT_STORY.length].title,
    body: item.description || item.body || DEFAULT_STORY[index % DEFAULT_STORY.length].description,
    imageLabel: item.imageLabel || item.title || DEFAULT_STORY[index % DEFAULT_STORY.length].imageLabel,
    tone: item.tone || STORY_TONES[index % STORY_TONES.length],
    image: order.storyImages?.[index] || storyPhotos[index]?.url,
  }));

  const galleryPhotos = order.referenceLayout
    ? []
    : orderPhotos
      .filter(photo => photo.label === 'gallery' || !photo.label || !['couple', 'story', 'venue'].includes(photo.label))
      .map(getGalleryPhotoUrl)
      .filter(Boolean);

  const gallerySources = order.galleryImages?.length ? order.galleryImages : galleryPhotos;

  const galleryItems = gallerySources.length
    ? gallerySources.map((src, index) => ({
      title: DEFAULT_GALLERY[index % DEFAULT_GALLERY.length].title,
      caption: DEFAULT_GALLERY[index % DEFAULT_GALLERY.length].caption,
      tone: DEFAULT_GALLERY[index % DEFAULT_GALLERY.length].tone,
      image: src,
    }))
    : DEFAULT_GALLERY;

  const embedSrc = mapEnabled ? buildMapEmbedUrl(wd.venueMapUrl, [venue, venueAddress].filter(Boolean).join(', ')) : null;
  const openMapHref = wd.venueMapUrl
    ? wd.venueMapUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, venueAddress].filter(Boolean).join(', '))}`;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);

    updatePreference();
    query.addEventListener('change', updatePreference);

    return () => query.removeEventListener('change', updatePreference);
  }, []);

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
    const interval = window.setInterval(calc, 1000);
    return () => window.clearInterval(interval);
  }, [order]);

  useEffect(() => {
    if (showSplash || !shouldPlayMusic || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = 0.5;
    audio.play().catch(() => undefined);
  }, [showSplash, shouldPlayMusic, order.musicUrl]);

  const handleSplashDismiss = () => {
    if (shouldPlayMusic && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => undefined);
    }
    setShowSplash(false);
  };

  const updateRsvpField = (field, value) => {
    setRsvpForm(current => ({ ...current, [field]: value }));
    setRsvpError('');
  };

  const handleRsvp = async (event) => {
    event.preventDefault();
    setRsvpError('');

    if (!rsvpForm.guestName.trim() || !rsvpForm.guestCount || !rsvpForm.attending) {
      setRsvpError('Please complete the required fields.');
      return;
    }

    if (demo) {
      setRsvpSubmitted(true);
      return;
    }

    try {
      const res = await fetch(`${API}/rsvps/${publicSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: rsvpForm.guestName.trim(),
          guestCount: Number(rsvpForm.guestCount) || 1,
          attending: rsvpForm.attending,
          dietaryPreferences: '',
          message: rsvpForm.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RSVP failed');
      setRsvpSubmitted(true);
    } catch (err) {
      setRsvpError(err.message);
    }
  };

  return (
    <div className="gazebo-theme theme-watercolor">
      {shouldPlayMusic && (
        <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />
      )}
      {showSplash && (
        <GazeboSplash
          onDismiss={handleSplashDismiss}
        />
      )}

      <section id="hero" className="gazebo-hero">
        <div className="gazebo-hero-media" aria-hidden>
          <img src="/assets/gazebo-watercolor-poster1.jpg" alt="" />
          {!prefersReducedMotion && !heroVideoFailed && (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/gazebo-watercolor-poster1.jpg"
              onError={() => setHeroVideoFailed(true)}
            >
              <source src="/assets/gazebo-watercolor2.mp4" type="video/mp4" />
            </video>
          )}
          <div className="gazebo-hero-media-wash" />
          <div className="gazebo-watercolor-grain" />
        </div>

        <motion.article
          className="gazebo-hero-copy"
          initial={{ opacity: 0, filter: 'blur(18px)', y: 28, scale: 0.98 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="gazebo-hero-date">{heroDate || fullDateStr}</p>
          <h1>{coupleNames}</h1>
          <p className="gazebo-hero-tagline">{message}</p>
          {timeStr && <p className="gazebo-hero-time">{timeStr}</p>}
        </motion.article>
      </section>

      {weddingDate && (
        <section className="gazebo-section gazebo-countdown">
          <div className="gazebo-section-soft-pattern" aria-hidden="true" />
          <SectionTitle eyebrow="The celebration begins in" title="Counting every heartbeat" />
          <div className="gazebo-count-grid">
            <CountdownUnit value={pad(timeLeft.days)} label="Days" />
            <CountdownUnit value={pad(timeLeft.hours)} label="Hours" />
            <CountdownUnit value={pad(timeLeft.minutes)} label="Minutes" />
            <CountdownUnit value={pad(timeLeft.seconds)} label="Seconds" />
          </div>
        </section>
      )}

      <section id="story" className="gazebo-section gazebo-story-section">
        <SectionTitle eyebrow="Our story" title="The path that brought us here" />
        <div className="gazebo-story-grid">
          {storyItems.map((item, index) => (
            <motion.article
              key={item.id}
              className="gazebo-card gazebo-story-card"
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.22 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
            >
              <div className="gazebo-story-art" style={{ background: item.tone }}>
                {item.image && <img src={item.image} alt="" />}
                <div />
              </div>
              <div className="gazebo-story-copy">
                <p className="gazebo-section-eyebrow">{item.date}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="details" className="gazebo-section gazebo-details-section">
        <SectionTitle
          eyebrow="Event details"
          title="Where love gathers"
        />
        <div className="gazebo-details-layout">
          <motion.div
            className="gazebo-card gazebo-details-card"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gazebo-details-intro">
              <h3>{venue || 'Garden venue'}</h3>
              <p>{message}</p>
            </div>
            <div className="gazebo-detail-list">
              <DetailItem label="Date & time" value={fullDateTime || 'To be announced'} />
              <DetailItem label="Venue" value={venue || 'Garden venue'} />
              {venueAddress && <DetailItem label="Address" value={venueAddress} />}
            </div>

            {embedSrc && (
              <a className="gazebo-map-frame" href={openMapHref} target="_blank" rel="noreferrer" aria-label="Open location map">
                <iframe
                  src={embedSrc}
                  title={venue || 'Venue location'}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  tabIndex="-1"
                />
              </a>
            )}
          </motion.div>
        </div>
      </section>

      <section id="rsvp" className="gazebo-section gazebo-rsvp-section">
        <SectionTitle eyebrow="Kindly reply" title="Reserve your place" />
        <AnimatePresence mode="wait">
          {!rsvpSubmitted ? (
            <motion.form
              key="gazebo-rsvp-form"
              className="gazebo-card gazebo-rsvp-card"
              onSubmit={handleRsvp}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              viewport={{ once: true, amount: 0.22 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              <div className="gazebo-rsvp-grid">
                <label>
                  <span>Guest name</span>
                  <input
                    value={rsvpForm.guestName}
                    onChange={event => updateRsvpField('guestName', event.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </label>
                <label>
                  <span>Guest count</span>
                  <select value={rsvpForm.guestCount} onChange={event => updateRsvpField('guestCount', event.target.value)} required>
                    {[1, 2, 3, 4, 5, 6].map(count => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset>
                <legend>Will you attend?</legend>
                <div className="gazebo-attending-grid">
                  {[
                    { value: 'yes', label: 'Joyfully yes' },
                    { value: 'no', label: 'With regrets' },
                  ].map(option => (
                    <label key={option.value} className={rsvpForm.attending === option.value ? 'active' : ''}>
                      <span>{option.label}</span>
                      <input
                        type="radio"
                        name="attending"
                        value={option.value}
                        checked={rsvpForm.attending === option.value}
                        onChange={event => updateRsvpField('attending', event.target.value)}
                        required
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label>
                <span>Message</span>
                <textarea
                  value={rsvpForm.message}
                  onChange={event => updateRsvpField('message', event.target.value)}
                  placeholder="Share a note for the couple"
                  rows={3}
                />
              </label>

              {rsvpError && <p className="gazebo-rsvp-error">{rsvpError}</p>}
              <button className="gazebo-primary-button gazebo-rsvp-submit" type="submit">Send RSVP</button>
            </motion.form>
          ) : (
            <motion.div
              key="gazebo-rsvp-success"
              className="gazebo-card gazebo-rsvp-success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span>Response received</span>
              <h3>Thank you, {rsvpForm.guestName}</h3>
              <p>Your reply has been sent to the couple.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section id="gallery" className="gazebo-section gazebo-gallery-section">
        <GazeboGallerySection items={galleryItems} />
      </section>

      <footer className="gazebo-footer">
        <div className="gazebo-footer-inner">
          <p className="gazebo-footer-made">With love</p>
          <h2>{coupleNames}</h2>
          <div className="gazebo-footer-rule" aria-hidden />
          <p className="gazebo-footer-thanks">Thank you for being part of our beginning.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, lead, children }) {
  return (
    <div className="gazebo-section-title">
      <p className="gazebo-section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
      {lead && <p className="gazebo-section-lead">{lead}</p>}
      <i aria-hidden />
    </div>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <motion.div
      className="gazebo-count-unit"
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <motion.strong
        key={`${label}-${value}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {value}
      </motion.strong>
      <span>{label}</span>
    </motion.div>
  );
}

function GazeboGallerySection({ items }) {
  const galleryRowRef = useRef(null);
  const galleryUnitRef = useRef(null);
  const imageItems = items.filter(item => item.image);
  const fallbackItems = imageItems.length ? [] : items;
  const galleryKey = items.map(item => item.image || item.title).join('|');
  const unitRepeatCount = imageItems.length ? Math.max(3, Math.ceil(12 / imageItems.length)) : 1;
  const unitItems = imageItems.length
    ? Array.from({ length: unitRepeatCount }, () => imageItems).flat()
    : fallbackItems;

  useEffect(() => {
    const row = galleryRowRef.current;
    const unit = galleryUnitRef.current;
    if (!row || !unit || !unitItems.length || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let distance = 0;
    let offset = 0;
    let previousTime = 0;
    let pixelsPerSecond = window.matchMedia('(max-width: 680px)').matches ? 28 : 36;

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
  }, [unitItems.length, galleryKey]);

  const renderGalleryGroup = (groupIndex) => unitItems.map((item, index) => {
    const optimized = item.image ? buildGalleryImageSources(item.image) : null;
    const imageNumber = imageItems.length ? (index % imageItems.length) + 1 : index + 1;

    return (
      <figure key={`${groupIndex}-${item.image || item.title}-${index}`} className="gazebo-memory-card">
        {optimized ? (
          <img
            src={optimized.src}
            srcSet={optimized.srcSet}
            sizes="(max-width: 680px) 220px, 300px"
            alt={`Memory ${imageNumber}`}
            loading="eager"
            decoding="async"
            fetchPriority={groupIndex === 0 && index < imageItems.length ? 'high' : 'auto'}
          />
        ) : (
          <div style={{ background: item.tone }} />
        )}
      </figure>
    );
  });

  return (
    <>
      <div className="gazebo-gallery-header">
        <h2>Memories</h2>
      </div>
      <div className="gazebo-gallery-viewport">
        <div
          className={`gazebo-gallery-row${unitItems.length ? ' gazebo-gallery-row-loop' : ''}`}
          ref={galleryRowRef}
        >
          {[0, 1, 2, 3].map((groupIndex) => (
            <div
              key={groupIndex}
              ref={groupIndex === 0 ? galleryUnitRef : null}
              className="gazebo-gallery-group"
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {renderGalleryGroup(groupIndex)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="gazebo-detail-item">
      <span aria-hidden />
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
