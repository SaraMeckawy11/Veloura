import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Handles scroll behavior on every route change:
// - With a hash (e.g. /#designs): smooth-scroll to that element once it's mounted.
// - Without a hash: smooth-scroll to top.
// Honors prefers-reduced-motion.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (hash) {
      // Wait a frame so the new route's DOM is mounted before we look up the element.
      const tryScroll = (attempt = 0) => {
        const el = document.querySelector(hash);
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, left: 0, behavior });
        } else if (attempt < 10) {
          // Element may not be mounted yet — retry briefly.
          setTimeout(() => tryScroll(attempt + 1), 50);
        }
      };
      tryScroll();
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash]);

  return null;
}
