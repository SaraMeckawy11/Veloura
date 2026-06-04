import { useEffect, useRef } from 'react';

// Keeps every invitation starting at the hero section.
//
// While the splash screen is open we lock scrolling and pin the document to the
// top, so scrolling down behind the splash can't move the page (which previously
// caused it to "jump back up"). Once the splash is dismissed we unlock and make
// sure we're still on the hero, so the guest always begins at the top rather than
// wherever the page happened to be scrolled (e.g. carried over from a route).
//
// We resolve the window/document from the rendered node's ownerDocument so this
// also works inside the order-flow preview iframe, where the component runs in
// the parent window but its DOM is portaled into the iframe.
export default function useHeroScrollReset(showSplash) {
  const rootRef = useRef(null);

  useEffect(() => {
    const node = rootRef.current;
    const doc = node?.ownerDocument || document;
    const win = doc.defaultView || window;
    const html = doc.documentElement;
    const body = doc.body;

    if (showSplash) {
      const prev = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyOverflowY: body.style.overflowY,
      };
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      win.scrollTo(0, 0);
      return () => {
        html.style.overflow = prev.htmlOverflow;
        body.style.overflow = prev.bodyOverflow;
        body.style.overflowY = prev.bodyOverflowY;
      };
    }

    // Splash dismissed — make sure we land on the hero.
    win.requestAnimationFrame(() => {
      win.scrollTo(0, 0);
      if (doc.scrollingElement) doc.scrollingElement.scrollTop = 0;
    });
    return undefined;
  }, [showSplash]);

  return rootRef;
}
