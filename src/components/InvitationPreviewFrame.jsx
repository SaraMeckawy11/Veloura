import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Renders invitation children inside a same-origin <iframe> so the design is
// laid out against the iframe's own viewport. This matters because every
// invitation/splash sizes itself with viewport units (100vw / 100dvh). Inside a
// phone-sized iframe those units resolve to the phone frame, so the splash door
// and every section render exactly as they do on a real mobile screen — fully
// visible, correct aspect ratio, never cut or distorted.
export default function InvitationPreviewFrame({ className, title = 'Invitation preview', children }) {
  const iframeRef = useRef(null);
  const [body, setBody] = useState(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;
    let observer = null;

    const setup = () => {
      const idoc = iframe.contentDocument;
      if (!idoc) return;

      idoc.documentElement.lang = document.documentElement.lang || 'en';
      idoc.documentElement.style.height = '100%';
      idoc.body.style.margin = '0';
      idoc.body.style.minHeight = '100%';
      idoc.body.style.background = '#fff';
      idoc.body.style.webkitUserSelect = 'none';
      idoc.body.style.userSelect = 'none';

      if (!idoc.querySelector('meta[name="viewport"]')) {
        const meta = idoc.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
        idoc.head.appendChild(meta);
      }

      // Keep the unpaid preview protected: no clean copy / drag / context menu.
      ['contextmenu', 'dragstart', 'copy'].forEach((evt) =>
        idoc.addEventListener(evt, (e) => e.preventDefault())
      );

      // Mirror the parent document's stylesheets into the iframe. Vite injects
      // <style> tags (dev) and the lazy invitation chunks add more after mount,
      // so copy what exists now and observe <head> for anything added later.
      const copied = new WeakSet();
      const copyNode = (node) => {
        if (node.nodeType !== 1 || copied.has(node)) return;
        const isStyle = node.tagName === 'STYLE';
        const isCssLink = node.tagName === 'LINK'
          && (node.rel === 'stylesheet' || node.rel === 'preconnect' || node.getAttribute('as') === 'style');
        if (!isStyle && !isCssLink) return;
        copied.add(node);
        idoc.head.appendChild(node.cloneNode(true));
      };
      document.head.querySelectorAll('style, link').forEach(copyNode);
      observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => m.addedNodes.forEach(copyNode));
      });
      observer.observe(document.head, { childList: true });

      setBody(idoc.body);
    };

    // about:blank is ready synchronously in most browsers; also handle load.
    if (iframe.contentDocument?.readyState === 'complete') setup();
    iframe.addEventListener('load', setup);

    return () => {
      iframe.removeEventListener('load', setup);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <iframe ref={iframeRef} className={className} title={title} />
      {body && createPortal(children, body)}
    </>
  );
}
