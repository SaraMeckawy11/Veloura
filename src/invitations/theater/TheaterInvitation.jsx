import { useEffect, useMemo, useRef, useState } from 'react';
import TheaterSplash from './TheaterSplash';
import './theater-final.css';
import { formatInvitationTime, getInvitationPhotoSrc } from '../shared';
import InvitationPhoto from '../InvitationPhoto';
import memoriesTitle from '../../assets/theater/memories/title(4)_transparent.png';
import memoriesContainer from '../../assets/theater/memories/emptyContainer_transparent.png';
import rsvpSeats from '../../assets/theater/rsvp/seats_transparent.png';
import storyFilmSeparator from '../../assets/theater/story/filmSeperator_transparent.png';
import storyTitle from '../../assets/theater/story/title7_transparent.png';

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
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpForm, setRsvpForm] = useState({ guestName: '', attending: 'yes', guestCount: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef(null);

  const weddingDetails = order.weddingDetails || {};
  const disabledFields = order.disabledFields || [];
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const weddingDate = useMemo(
    () => (weddingDetails.weddingDate ? new Date(weddingDetails.weddingDate) : null),
    [weddingDetails.weddingDate],
  );
  const shouldPlayMusic = Boolean(order.musicUrl && order.musicEnabled !== false);
  const isReferenceDemo = Boolean(demo && order.referenceLayout);

  const dayStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const monthStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const monthYearStr = weddingDate ? weddingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : '';
  const dayOfMonth = weddingDate ? weddingDate.getDate() : '';
  const fullDateStr = weddingDate
    ? weddingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const name1 = weddingDetails.brideName || weddingDetails.groomName || 'Partner 1';
  const name2 = weddingDetails.groomName || weddingDetails.brideName || 'Partner 2';
  const firstName = (full) => (full || '').trim().split(/\s+/)[0] || full || '';
  const heroName1 = firstName(name1);
  const heroName2 = firstName(name2);
  const venue = weddingDetails.venue || '';
  const venueAddress = fieldEnabled('venueAddress') ? (weddingDetails.venueAddress || '') : '';
  const timeStr = fieldEnabled('weddingTime') ? formatInvitationTime(weddingDetails.weddingTime) : '';

  const storyPhotos = (order.photos || []).filter(photo => photo.label === 'story');
  const galleryPhotos = (order.photos || []).filter(photo => photo.label === 'gallery');
  const uncategorizedPhotos = (order.photos || []).filter(photo => (
    !photo.label || !['couple', 'story', 'gallery', 'venue'].includes(photo.label)
  ));

  const storyImages = isReferenceDemo && order.storyImages?.length ? order.storyImages : storyPhotos;
  const storyMilestones = order.storyMilestones || [];
  const storyItemCount = Math.min(4, Math.max(storyImages.length, storyMilestones.length));
  const storyItems = Array.from({ length: storyItemCount }, (_, index) => ({
    image: storyImages[index],
    ...(storyMilestones[index] || {}),
  })).filter(item => item.image || item.date || item.title || item.description || item.body);

  const galleryImages = (
    isReferenceDemo && order.galleryImages?.length
      ? order.galleryImages
      : [...galleryPhotos, ...uncategorizedPhotos]
  ).filter(byUniquePhoto);

  const mapQuery = [venue, venueAddress].filter(Boolean).join(', ');
  const embedSrc = fieldEnabled('venueMapUrl') ? buildMapEmbedUrl(weddingDetails.venueMapUrl, mapQuery) : null;

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
        body: JSON.stringify(rsvpForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'RSVP failed');
      setRsvpSubmitted(true);
    } catch (err) {
      setRsvpError(err.message);
    }
  };

  return (
    <div className="theater-theme">
      {shouldPlayMusic && <audio ref={audioRef} src={order.musicUrl} loop preload="auto" aria-hidden="true" />}
      {showSplash && <TheaterSplash onDismiss={handleSplashDismiss} />}

      <main className="theater-invitation">
        <HeroSection
          name1={heroName1}
          name2={heroName2}
          dayStr={dayStr}
          monthYearStr={monthYearStr}
          dayOfMonth={dayOfMonth}
          timeStr={timeStr}
          venue={venue}
          weddingDate={weddingDate}
        />

        {weddingDate && <CountdownSection timeLeft={timeLeft} />}
        {storyItems.length > 0 && <StorySection items={storyItems} />}

        <DetailsSection
          dayStr={dayStr}
          monthStr={monthStr}
          dayOfMonth={dayOfMonth}
          fullDateStr={fullDateStr}
          timeStr={timeStr}
          venue={venue}
          venueAddress={venueAddress}
          embedSrc={embedSrc}
        />

        {fieldEnabled('rsvp') && (
          <RsvpSection
            rsvpForm={rsvpForm}
            setRsvpForm={setRsvpForm}
            rsvpSubmitted={rsvpSubmitted}
            rsvpError={rsvpError}
            handleRsvp={handleRsvp}
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

function HeroSection({
  name1,
  name2,
  dayStr,
  monthYearStr,
  dayOfMonth,
  timeStr,
  venue,
  weddingDate,
}) {
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
            <span>{monthYearStr}</span>
          </div>
        </div>
      )}
      {timeStr && <p className="theater-hero-time">Doors open at {timeStr}</p>}
      <h2>{venue || 'The Royale Grand Theatre'}</h2>
    </section>
  );
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
                <InvitationPhoto src={item.image} alt={item.title || `Story ${index + 1}`} sizes="(max-width: 720px) 76vw, 420px" />
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
  dayOfMonth,
  fullDateStr,
  timeStr,
  venue,
  venueAddress,
  embedSrc,
}) {
  return (
    <section className="theater-details" aria-label="Wedding details">
      <div className="theater-details-plate" aria-hidden="true" />
      <div className="theater-details-venue">
        <h2>{venue || 'The Royale Grand Theatre'}</h2>
        {venueAddress && <p>{venueAddress}</p>}
      </div>
      <div className="theater-details-date">
        <strong>{dayStr || fullDateStr || 'To be announced'}</strong>
        <span>{dayOfMonth && monthStr ? `${dayOfMonth} ${monthStr}` : fullDateStr}</span>
      </div>
      <div className="theater-details-time">
        <strong>{timeStr || 'To be announced'}</strong>
        <span>Doors open</span>
      </div>
      <div className="theater-details-map" aria-hidden={!embedSrc}>
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title="Venue location"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
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
              title="Accepts"
              subtitle="with pleasure"
            />
            <RsvpChoice
              active={rsvpForm.attending === 'no'}
              onClick={() => setRsvpForm({ ...rsvpForm, attending: 'no' })}
              title="Declines"
              subtitle="with regret"
            />
          </div>

          <label className="theater-guests-field">
            <img src={rsvpSeats} alt="" aria-hidden="true" />
            <span>Number of guests attending</span>
            <input
              type="number"
              min={1}
              max={10}
              value={rsvpForm.guestCount}
              onChange={event => setRsvpForm({ ...rsvpForm, guestCount: parseInt(event.target.value, 10) || 1 })}
            />
          </label>

          <label className="theater-message-field">
            <span>Message for the bride and groom</span>
            <textarea
              rows={2}
              placeholder="Share a wish, a memory, or a song…"
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
      <small>{subtitle}</small>
    </button>
  );
}

function MemoriesSection({ images }) {
  const uniqueImages = useMemo(() => images.filter(byUniquePhoto), [images]);

  if (!uniqueImages.length) return null;

  const tracks = [
    { key: 'a', images: uniqueImages, hidden: false },
    { key: 'b', images: uniqueImages, hidden: true },
  ];

  return (
    <section className="theater-memories" aria-labelledby="theater-memories-title">
      <TheaterAssetTitle
        className="theater-memories-title"
        titleId="theater-memories-title"
        artSrc={memoriesTitle}
        label="Memories"
      />
      <div className="theater-memories-viewport">
        <div className="theater-memories-track">
          {tracks.map(track => (
            <ul
              className="theater-memories-list"
              key={track.key}
              aria-hidden={track.hidden ? 'true' : undefined}
            >
              {track.images.map((image, index) => (
                <li className="theater-memory-card" key={`${track.key}-${getInvitationPhotoSrc(image)}`}>
                  <img className="theater-memory-frame" src={memoriesContainer} alt="" aria-hidden="true" />
                  <div className="theater-memory-photo">
                    <InvitationPhoto
                      src={image}
                      sizes="(max-width: 720px) 200px, 260px"
                      alt={`Memory ${index + 1}`}
                      loading={track.hidden ? 'lazy' : 'eager'}
                      fetchPriority={track.hidden ? 'auto' : 'high'}
                    />
                  </div>
                </li>
              ))}
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
