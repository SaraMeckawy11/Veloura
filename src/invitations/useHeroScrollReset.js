import { useEffect, useRef } from 'react';

// Keeps every invitation starting at the hero while freeing scrolling quickly.
//
// On mount we pin the document to the top and briefly lock scrolling, so the
// guest always begins at the hero (rather than wherever the previous route was
// scrolled) and a stray early scroll can't shift the page before the hero has
// been revealed. The lock holds for a couple of seconds — long enough that the
// splash has opened onto the hero — then releases so the page becomes
// scrollable. We deliberately don't snap back to the top when the splash finally
// dismisses, so a guest who has already started scrolling isn't yanked back up.
//
// We resolve the window/document from the rendered node's ownerDocument so this
// also works inside the order-flow preview iframe, where the component runs in
// the parent window but its DOM is portaled into the iframe.
const HERO_SCROLL_LOCK_MS = 2000;

export default function useHeroScrollReset(showSplash) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!showSplash) return undefined;
    const node = rootRef.current;
    const doc = node?.ownerDocument || document;
    const win = doc.defaultView || window;
    const html = doc.documentElement;
    const body = doc.body;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverflowY: body.style.overflowY,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    win.scrollTo(0, 0);

    const unlock = () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overflowY = prev.bodyOverflowY;
    };
    const timer = win.setTimeout(unlock, HERO_SCROLL_LOCK_MS);

    return () => {
      win.clearTimeout(timer);
      unlock();
    };
  }, [showSplash]);

  return rootRef;
}
