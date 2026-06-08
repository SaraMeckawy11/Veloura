// Shared "Bringing a plus-one?" yes/no control rendered inside the RSVP form of
// every invitation design when the couple enables the plus-one question
// (weddingDetails.askPlusOne). Styling is theme-neutral and inherits the
// surrounding text colour so it blends into each design's RSVP card.

export default function RsvpPlusOneField({ value, onChange, className = '', label = 'Bringing a plus-one?' }) {
  return (
    <div className={`rsvp-plus-one ${className}`.trim()}>
      <span className="rsvp-plus-one-label">{label}</span>
      <div className="rsvp-plus-one-toggle" role="radiogroup" aria-label={label}>
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          className={value === true ? 'active' : ''}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={value === false ? 'active' : ''}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}
