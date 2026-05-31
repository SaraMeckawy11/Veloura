import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './guest-count-field.css';

/**
 * Premium guest-count picker shared across all invitation templates.
 *
 * Renders a compact trigger that opens a centered selection modal with
 * tappable number tiles instead of a plain native dropdown. Theming is driven
 * by the `theme` prop, which sets a `gc-theme-<theme>` class (and matching CSS
 * variables) on both the trigger and the portalled modal.
 */
export default function GuestCountField({
  id,
  value,
  onChange,
  max = 10,
  label = 'Number of guests',
  theme = 'default',
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const options = Array.from({ length: max }, (_, index) => index + 1);
  const current = Number(value) || 1;

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const select = (count) => {
    onChange(count);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`gc-trigger gc-theme-${theme}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="gc-trigger-value">{current}</span>
        <svg className="gc-trigger-caret" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && createPortal(
        <div className={`gc-modal-root gc-theme-${theme}`} role="dialog" aria-modal="true" aria-label={label}>
          <button type="button" className="gc-modal-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="gc-modal-panel" role="document">
            <p className="gc-modal-title">{label}</p>
            <div className="gc-modal-grid">
              {options.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`gc-tile${count === current ? ' gc-tile--active' : ''}`}
                  aria-pressed={count === current}
                  onClick={() => select(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
