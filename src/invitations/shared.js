const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

export function formatInvitationTime(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    hours = hours % 12 || 12;
    return `${hours}:${minutes}`;
  }

  if (hours === 0) return `12:${minutes}`;
  if (hours > 12) return `${hours - 12}:${minutes}`;
  return `${hours}:${minutes}`;
}

function buildOptimizedImageUrl(src, transform) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || !src.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return src;
  }

  const [prefix, rest] = src.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (!prefix || !rest || rest.startsWith(`${transform}/`)) return src;

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transform}/${rest}`;
}

export function buildInvitationImageSources(src) {
  const small = buildOptimizedImageUrl(src, 'c_limit,f_auto,q_auto:best,dpr_auto,w_720');
  const medium = buildOptimizedImageUrl(src, 'c_limit,f_auto,q_auto:best,dpr_auto,w_1440');
  const large = buildOptimizedImageUrl(src, 'c_limit,f_auto,q_auto:best,dpr_auto,w_2400');

  if (small === src && medium === src && large === src) {
    return { src, srcSet: undefined, backgroundSrc: src };
  }

  return {
    src: large,
    srcSet: `${small} 720w, ${medium} 1440w, ${large} 2400w`,
    backgroundSrc: medium,
  };
}
