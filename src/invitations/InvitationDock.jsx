import { useEffect, useState } from 'react';
import './invitation-dock.css';

const icons = {
  hero: (
    <path d="M5 11.5 12 5l7 6.5V20h-5v-5h-4v5H5v-8.5Z" />
  ),
  story: (
    <path d="M6 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1Zm2 4h7M8 12h7M8 16h4" />
  ),
  details: (
    <path d="M12 21s7-5.1 7-12A7 7 0 1 0 5 9c0 6.9 7 12 7 12Zm0-9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5Z" />
  ),
  rsvp: (
    <path d="M4 6.5 12 13l8-6.5M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
  ),
  gallery: (
    <path d="M4 5h16v14H4V5Zm0 10 4-4 3 3 2-2 7 7M16.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  ),
};

function DockIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {icons[name] || icons.hero}
    </svg>
  );
}

export default function InvitationDock({ items, audioRef, musicEnabled = false, theme = 'coastal' }) {
  const [activeId, setActiveId] = useState(items[0]?.id || 'hero');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const itemIds = items.map(item => item.id).join('|');

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  useEffect(() => {
    const sections = itemIds.split('|').map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-28% 0px -55% 0px', threshold: [0, 0.15, 0.4] }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [itemIds]);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return undefined;
    const sync = () => setIsPlaying(!audio.paused);
    sync();
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('ended', sync);
    return () => {
      audio.removeEventListener('play', sync);
      audio.removeEventListener('pause', sync);
      audio.removeEventListener('ended', sync);
    };
  }, [audioRef]);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleMusic = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  };

  return (
    <aside className={`invitation-dock invitation-dock--${theme}`} aria-label="Invitation navigation">
      <span className="invitation-dock__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
      <nav className="invitation-dock__nav">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={activeId === item.id ? 'is-active' : ''}
            aria-label={`Go to ${item.label}`}
            aria-current={activeId === item.id ? 'location' : undefined}
            onClick={() => goTo(item.id)}
          >
            <DockIcon name={item.icon || item.id} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {musicEnabled && (
        <button
          type="button"
          className={`invitation-dock__music${isPlaying ? ' is-playing' : ''}`}
          onClick={toggleMusic}
          aria-label={isPlaying ? 'Pause invitation music' : 'Play invitation music'}
          aria-pressed={isPlaying}
        >
          <span className="invitation-dock__equalizer" aria-hidden="true"><i /><i /><i /></span>
          <span className="invitation-dock__music-label">{isPlaying ? 'Pause' : 'Music'}</span>
        </button>
      )}
    </aside>
  );
}
