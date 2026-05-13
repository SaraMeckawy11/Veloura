import './invitation-photo.css';
import { buildInvitationImageSources } from './shared';

export default function InvitationPhoto({
  src,
  alt,
  className,
  sizes = '100vw',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
}) {
  if (!src) return null;

  const optimized = buildInvitationImageSources(src);

  return (
    <span className={['invitation-photo', className].filter(Boolean).join(' ')}>
      <span className="invitation-photo__backdrop" aria-hidden="true">
        <span
          className="invitation-photo__backdrop-image"
          style={{ backgroundImage: `url("${optimized.backgroundSrc || optimized.src}")` }}
        />
        <span className="invitation-photo__backdrop-wash" />
      </span>
      <img
        className="invitation-photo__img"
        src={optimized.src}
        srcSet={optimized.srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
      />
    </span>
  );
}
