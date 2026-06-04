// Shared "For our cherished guests" guest-policy block rendered in the details
// section of the card-based invitation designs. Each design passes its own theme
// class so the surrounding CSS can style the kicker, list, and icons to match the
// palette. The label intentionally differs from the envelope "A Note" message to
// avoid two sections reading as the same thing.

const ChildrenIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-4.35-9.33-8.5C1.1 9.64 2.5 6.5 5.5 6.5c1.9 0 3.1 1.1 3.9 2.3.4.6 1 1 1.6 1 .6 0 1.2-.4 1.6-1 .8-1.2 2-2.3 3.9-2.3 3 0 4.4 3.14 2.83 6C19 16.65 12 21 12 21z" />
  </svg>
);

const GuestIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M18 8v5M15.5 10.5h5" />
  </svg>
);

export const GUEST_NOTE_ICONS = [ChildrenIcon, GuestIcon];

export default function GuestNote({ lines, className = '' }) {
  if (!lines?.length) return null;
  return (
    <div className={`gp-note ${className}`.trim()}>
      <ul className="gp-list">
        {lines.map((line, index) => (
          <li className="gp-item" key={line}>
            <span className="gp-icon">{GUEST_NOTE_ICONS[index] || GuestIcon}</span>
            <span className="gp-text">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
