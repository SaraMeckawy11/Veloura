import { useEffect, useMemo, useRef, useState } from 'react';
import TheaterSplash from './TheaterSplash';
import './theater-final.css';
import { containInvitationPhoto, createRsvpSubmissionId, DEFAULT_COUPLE_MESSAGE, formatInvitationName, formatInvitationTime, getInvitationPhotoSrc } from '../shared';
import { getInvitationFontStyle } from '../fontOptions';
import { getTieredInvitationPhotos, getTieredStoryMilestones, invitationTierAllows } from '../tierAccess';
import InvitationPhoto from '../InvitationPhoto';
import RsvpPlusOneField from '../RsvpPlusOneField';
import useHeroScrollReset from '../useHeroScrollReset';
import memoriesTitle from '../../assets/theater/memories/title(4)_transparent.png';
import storyFilmSeparator from '../../assets/theater/story/filmSeperator_transparent.png';
import storyTitle from '../../assets/theater/story/title7_transparent.png';
import theaterEnvelope from '../../assets/theater/theater-envelope-transparent.png';

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

  return fallbackQuery?.trim()
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery.trim())}&output=embed`
    : null;
}

function byUniquePhoto(image, index, allImages) {
  const src = getInvitationPhotoSrc(image);
  return src && allImages.findIndex(candidate => getInvitationPhotoSrc(candidate) === src) === index;
}

export default function TheaterInvitation({ order, demo = false, publicSlug }) {
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, plusOne: false, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);
  const rsvpSubmissionId = useRef(createRsvpSubmissionId());
  const rootRef = useHeroScrollReset(showSplash);

  const weddingDetails = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const weddingDate = useMemo(
    () => (weddingDetails.weddingDate ? new Date(weddingDetails.weddingDate) : null),
    [weddingDetails.weddingDate],
  );
  const shouldPlayMusic = invitationTierAllows(order, 'music') && Boolean(order.musicUrl && order.musicEnabled !== false);
  const isReferenceDemo = Boolean(demo && order.referenceLayout);

  const dayStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const detailsDayStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const monthStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const heroMonthStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase() : '';
  const yearStr = weddingDate ? String(weddingDate.getFullYear()) : '';
  const dayOfMonth = weddingDate ? weddingDate.getDate() : '';
  const fullDateStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const name1 = formatInvitationName(weddingDetails.brideName || weddingDetails.groomName || 'Partner 1');
  const name2 = formatInvitationName(weddingDetails.groomName || weddingDetails.brideName || 'Partner 2');
  const firstName = (full) => (full || '').trim().split(/\s+/)[0] || full || '';
  const heroName1 = firstName(name1);
  const heroName2 = firstName(name2);
  const venue = weddingDetails.venue || '';
  const venueAddress = '';
  const timeStr = fieldEnabled('weddingTime') ? formatInvitationTime(weddingDetails.weddingTime, weddingDetails.timeFormat) : '';
  const coupleMessage = fieldEnabled('coupleMessage')
    ? (order.coupleMessage !== undefined && order.coupleMessage !== null
      ? order.coupleMessage
      : ((demo ? DEFAULT_COUPLE_MESSAGE : weddingDetails.message) || DEFAULT_COUPLE_MESSAGE))
    : '';
  const askPlusOne = Boolean(weddingDetails.askPlusOne);

  const storyAllowed = invitationTierAllows(order, 'story');
  const galleryAllowed = invitationTierAllows(order, 'gallery');
  const tieredPhotos = getTieredInvitationPhotos(order);
  const storyPhotos = tieredPhotos.filter(photo => photo.label === 'story');
  const galleryPhotos = tieredPhotos.filter(photo => photo.label === 'gallery');
  const uncategorizedPhotos = tieredPhotos.filter(photo => (
    !photo.label || !['couple', 'story', 'gallery', 'venue'].includes(photo.label)
  ));

  const storyImages = storyAllowed && isReferenceDemo && order.storyImages?.length ? order.storyImages : storyPhotos;
  const storyMilestones = getTieredStoryMilestones(order);
  const storyItemCount = Math.min(4, Math.max(storyImages.length, storyMilestones.length));
  const storyItems = Array.from({ length: storyItemCount }, (_, index) => ({
    image: storyImages[index],
    ...(storyMilestones[index] || {}),
  })).filter(item => item.image || item.date || item.title || item.description || item.body);

  const galleryImages = (
    galleryAllowed && isReferenceDemo && order.galleryImages?.length
      ? order.galleryImages
      : [...galleryPhotos, ...uncategorizedPhotos]
  ).filter(byUniquePhoto);

  const mapQuery = [venue, venueAddress].filter(Boolean).join(', ');
  const embedSrc = fieldEnabled('venueMapUrl') ? buildMapEmbedUrl(weddingDetails.venueMapUrl, mapQuery) : null;
  const openMapHref = weddingDetails.venueMapUrl
    ? weddingDetails.venueMapUrl
    : (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null);

  useEffect(() => {
    if (!weddingDate) return undefined;

    const target = weddingDate.getTime();
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
  }, [weddingDate]);

  useEffect(() => {
    if (showSplash || !shouldPlayMusic || !audioRef.current) return;
    audioRef.current.volume = 0.52;
    audioRef.current.play().catch(() => undefined);
  }, [showSplash, shouldPlayMusic, order.musicUrl]);

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

  return (
    <div ref={rootRef} className={`theater-theme${showSplash && !splashReady ? ' invitation-splash-gated' : ''}`} style={getInvitationFontStyle(order)}>
      {shouldPlayMusic && <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />}
      {showSplash && <TheaterSplash onReady={() => setSplashReady(true)} onDismiss={handleSplashDismiss} />}

      <main className="theater-invitation">
        <HeroSection
          name1={heroName1}
          name2={heroName2}
          dayStr={dayStr}
          heroMonthStr={heroMonthStr}
          yearStr={yearStr}
          dayOfMonth={dayOfMonth}
          timeStr={timeStr}
          venue={venue}
          weddingDate={weddingDate}
        />

        {weddingDate && <CountdownSection timeLeft={timeLeft} />}
        {storyItems.length > 0 && <StorySection items={storyItems} />}

        <DetailsSection
          dayStr={detailsDayStr}
          monthStr={monthStr}
          yearStr={yearStr}
          dayOfMonth={dayOfMonth}
          fullDateStr={fullDateStr}
          timeStr={timeStr}
          venue={venue}
          embedSrc={embedSrc}
          mapHref={openMapHref}
        />

        {coupleMessage && <TheaterMessageSection message={coupleMessage} />}

        {fieldEnabled('rsvp') && invitationTierAllows(order, 'rsvp') && (
          <RsvpSection
            rsvpForm={rsvpForm}
            setRsvpForm={setRsvpForm}
            rsvpSubmitted={rsvpSubmitted}
            rsvpError={rsvpError}
            handleRsvp={handleRsvp}
            askPlusOne={askPlusOne}
          />
        )}

        {galleryImages.length > 0 && <MemoriesSection images={galleryImages} />}

        <footer className="theater-finale">
          <div className="theater-finale-inner">
            <p className="theater-finale-script">with love</p>
            <h2 className="theater-finale-names">
              {heroName1} <span className="theater-finale-amp">&amp;</span> {heroName2}
            </h2>
            <div className="theater-finale-rule" aria-hidden="true" />
            <p className="theater-finale-thanks">Thank you for being part of our beginning</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function TheaterMessageSection({ message }) {
  return (
    <section className="theater-message" aria-label="A note from the couple">
      <h2>A Note</h2>
      <div className="theater-envelope">
        <img className="theater-envelope-image" src={theaterEnvelope} alt="" aria-hidden="true" />
        <article className="theater-envelope-copy">
          <span>From Our Hearts to Yours</span>
          <p>{message}</p>
        </article>
      </div>
    </section>
  );
}

function HeroSection({
  name1,
  name2,
  dayStr,
  heroMonthStr,
  yearStr,
  dayOfMonth,
  timeStr,
  venue,
  weddingDate,
}) {
  const venueLines = splitVenueLines(venue || 'The Royale Grand Theatre');

  return (
    <section className="theater-hero" aria-label="Wedding invitation">
      <h1>
        <span>{name1}</span>
        <em>&amp;</em>
        <span>{name2}</span>
      </h1>
      {weddingDate && (
        <div className="theater-hero-date">
          <span className="theater-hero-weekday">{dayStr}</span>
          <div className="theater-hero-date-row">
            <strong>{dayOfMonth}</strong>
            <span className="theater-hero-month">{heroMonthStr}</span>
            <span className="theater-hero-year">{yearStr}</span>
          </div>
        </div>
      )}
      {timeStr && <p className="theater-hero-time">Doors open at {timeStr}</p>}
      <h2>
        {venueLines.map(line => <span key={line}>{line}</span>)}
      </h2>
    </section>
  );
}

function splitVenueLines(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [text];

  const midpoint = Math.ceil(words.length / 2);
  return [
    words.slice(0, midpoint).join(' '),
    words.slice(midpoint).join(' '),
  ].filter(Boolean);
}

function CountdownSection({ timeLeft }) {
  const pad = (value) => String(value).padStart(2, '0');
  const countdown = [
    { label: 'Days', value: pad(timeLeft.days) },
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Minutes', value: pad(timeLeft.minutes) },
    { label: 'Seconds', value: pad(timeLeft.seconds) },
  ];

  return (
    <section className="theater-countdown" aria-label="Countdown">
      <div className="theater-count-grid">
        {countdown.map(item => (
          <div className="theater-count-card" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StorySection({ items }) {
  return (
    <section className="theater-story" aria-labelledby="theater-story-title">
      <TheaterAssetTitle
        className="theater-story-title"
        titleId="theater-story-title"
        artSrc={storyTitle}
        label="Our story"
      />
      <div className="theater-story-list">
        {items.map((item, index) => (
          <article className="theater-story-card" key={`${item.title || 'story'}-${index}`}>
            <div className="theater-story-photo">
              {item.image ? (
                <InvitationPhoto src={containInvitationPhoto(item.image)} alt={item.title || `Story ${index + 1}`} sizes="(max-width: 720px) 76vw, 420px" />
              ) : (
                <div className="theater-story-photo-empty" aria-hidden="true" />
              )}
            </div>
            <img className="theater-story-film" src={storyFilmSeparator} alt="" aria-hidden="true" />
            <div className="theater-story-copy">
              {item.date && <span>{item.date}</span>}
              {item.title && <h3>{item.title}</h3>}
              {(item.description || item.body) && <p>{item.description || item.body}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailsSection({
  dayStr,
  monthStr,
  yearStr,
  dayOfMonth,
  fullDateStr,
  timeStr,
  venue,
  embedSrc,
  mapHref,
}) {
  return (
    <section className="theater-details" aria-label="Wedding details">
      <div className="theater-details-plate" aria-hidden="true" />
      <div className="theater-details-venue">
        <h2>{venue || 'The Royale Grand Theatre'}</h2>
      </div>
      <div className="theater-details-date">
        <strong>{dayStr || fullDateStr || 'To be announced'}</strong>
        <span>{dayOfMonth && monthStr ? `${dayOfMonth} ${monthStr}${yearStr ? ` ${yearStr}` : ''}` : fullDateStr}</span>
      </div>
      <div className="theater-details-time">
        <strong>{timeStr || 'To be announced'}</strong>
      </div>
      <div className="theater-details-map" aria-hidden={!embedSrc}>
        {embedSrc ? (
          <>
            <iframe
              src={embedSrc}
              title="Venue location"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {mapHref && (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open location in Google Maps"
              />
            )}
          </>
        ) : null}
      </div>
      <div className="theater-details-invite">
        <p>Join us for an evening of love, light, and unforgettable moments.</p>
      </div>
    </section>
  );
}

function RsvpSection({
  rsvpForm,
  setRsvpForm,
  rsvpSubmitted,
  rsvpError,
  handleRsvp,
  askPlusOne,
}) {
  return (
    <section className="theater-rsvp" aria-labelledby="theater-rsvp-title">
      <h2 id="theater-rsvp-title" className="visually-hidden">RSVP</h2>
      {!rsvpSubmitted ? (
        <form className="theater-rsvp-form" onSubmit={handleRsvp}>
          <label className="theater-name-field">
            <span>Name</span>
            <input
              type="text"
              required
              value={rsvpForm.guestName}
              onChange={event => setRsvpForm({ ...rsvpForm, guestName: event.target.value })}
            />
          </label>

          <div className="theater-rsvp-choice" role="radiogroup" aria-label="Will you attend?">
            <RsvpChoice
              active={rsvpForm.attending === 'yes'}
              onClick={() => setRsvpForm({ ...rsvpForm, attending: 'yes' })}
              title="Yes"
            />
            <RsvpChoice
              active={rsvpForm.attending === 'maybe'}
              onClick={() => setRsvpForm({ ...rsvpForm, attending: 'maybe' })}
              title="Maybe"
            />
            <RsvpChoice
              active={rsvpForm.attending === 'no'}
              onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}
              title="No"
            />
          </div>

          {askPlusOne && (
            <RsvpPlusOneField
              className="theater-plus-one"
              value={rsvpForm.plusOne}
              onChange={value => setRsvpForm({ ...rsvpForm, plusOne: value })}
            />
          )}

          <label className="theater-message-field">
            <span>Message for the couple</span>
            <textarea
              rows={3}
              placeholder="Share a wish, memory, or song request"
              value={rsvpForm.message}
              onChange={event => setRsvpForm({ ...rsvpForm, message: event.target.value })}
            />
          </label>

          {rsvpError && <p className="theater-rsvp-error">{rsvpError}</p>}
          <button className="theater-rsvp-submit" type="submit" aria-label="Confirm your seat" />
        </form>
      ) : (
        <div className="theater-rsvp-success">
          <h3>Response received</h3>
          <p>Thank you, {rsvpForm.guestName}. Your seat is confirmed.</p>
        </div>
      )}
    </section>
  );
}

function RsvpChoice({ active, onClick, title, subtitle }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={active ? 'active' : ''}
      onClick={onClick}
    >
      <span aria-hidden="true" />
      <strong>{title}</strong>
      {subtitle && <small>{subtitle}</small>}
    </button>
  );
}

function MemoriesSection({ images }) {
  const uniqueImages = useMemo(() => images.filter(byUniquePhoto), [images]);
  const memoryImageKey = uniqueImages.map(getInvitationPhotoSrc).join('|');
  const trackRef = useRef(null);
  const unitRef = useRef(null);
  const unitRepeatCount = uniqueImages.length ? Math.max(3, Math.ceil(12 / uniqueImages.length)) : 0;
  const repeatedImages = uniqueImages.length
    ? Array.from({ length: unitRepeatCount }, () => uniqueImages).flat()
    : [];

  useEffect(() => {
    const track = trackRef.current;
    const unit = unitRef.current;
    if (!track || !unit || !repeatedImages.length || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = track.parentElement;
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
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
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
        track.style.transform = 'translate3d(0, 0, 0)';
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
  }, [repeatedImages.length, memoryImageKey]);

  if (!uniqueImages.length) return null;

  const renderGroup = (groupIndex) => repeatedImages.map((image, index) => {
    const imageNumber = (index % uniqueImages.length) + 1;
    const imageSrc = getInvitationPhotoSrc(image);
    return (
      <li className="theater-memory-card" key={`${groupIndex}-${imageSrc}-${index}`}>
        <div className="theater-memory-photo">
          <InvitationPhoto
            src={image}
            sizes="(max-width: 720px) 200px, 260px"
            alt={`Memory ${imageNumber}`}
            loading={groupIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={groupIndex === 0 && index < uniqueImages.length ? 'high' : 'auto'}
          />
        </div>
      </li>
    );
  });

  return (
    <section className="theater-memories" aria-labelledby="theater-memories-title">
      <TheaterAssetTitle
        className="theater-memories-title"
        titleId="theater-memories-title"
        artSrc={memoriesTitle}
        label="Memories"
      />
      <div className="theater-memories-viewport">
        <div className="theater-memories-track" ref={trackRef}>
          {[0, 1, 2, 3].map((groupIndex) => (
            <ul
              key={groupIndex}
              ref={groupIndex === 0 ? unitRef : null}
              className="theater-memories-list"
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {renderGroup(groupIndex)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

function TheaterAssetTitle({ className, titleId, artSrc, label }) {
  return (
    <header className={`theater-asset-title ${className}`}>
      <h2 id={titleId}>{label}</h2>
      <img className="theater-title-art" src={artSrc} alt="" aria-hidden="true" />
    </header>
  );
}
