import { useEffect, useRef } from 'react';

// Keeps every invitation starting at the hero section. Once the splash screen is
// dismissed (showSplash -> false) we scroll the invitation's own document back to
// the top, so the guest always lands on the hero rather than wherever the page
// happened to be scrolled (e.g. carried over from the previous route).
//
// We resolve the window/document from the rendered node's ownerDocument so this
// also works inside the order-flow preview iframe, where the component runs in
// the parent window but its DOM is portaled into the iframe.
export default function useHeroScrollReset(showSplash) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (showSplash) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument || document;
    const win = doc.defaultView || window;
    win.requestAnimationFrame(() => {
      win.scrollTo(0, 0);
      if (doc.scrollingElement) doc.scrollingElement.scrollTop = 0;
    });
  }, [showSplash]);

  return rootRef;
}
