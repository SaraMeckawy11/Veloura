import './invitation-section-transition.css';

export default function InvitationSectionTransition({ hero = false }) {
  return (
    <span
      className={`invitation-section-transition${hero ? ' invitation-section-transition--hero' : ''}`}
      aria-hidden="true"
    />
  );
}
