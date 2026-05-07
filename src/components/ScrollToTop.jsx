import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Smoothly scrolls to the top of the page on every route change.
// Skips when the URL already has a hash (in-page anchor navigation handles its own scroll).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [pathname, hash]);

  return null;
}
