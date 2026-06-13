const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';
const VALID_PHOTO_FITS = new Set(['cover', 'contain']);
export const DEFAULT_COUPLE_MESSAGE = 'Thank you for being part of the moments that brought us here. We feel incredibly lucky to celebrate this beginning with the people we love most.';
export const DEFAULT_PLUS_ONE_POLICY_TEXT = 'To keep our celebration intimate, we kindly ask that this invitation be lovingly reserved for the guest count included.';

export function formatInvitationName(value = '') {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, prefix, letter) => prefix + letter.toLocaleUpperCase('en-US'));
}

export function createRsvpSubmissionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function addCalendarMonthsClamped(date, months) {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  return next;
}

export function calculateCountdownTimeLeft(targetDate, nowDate = new Date()) {
  const target = new Date(targetDate);
  const now = new Date(nowDate);

  if (!Number.isFinite(target.getTime()) || target <= now) {
    return { months: 0, days: 0, hours: 0 };
  }

  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  let anchor = addCalendarMonthsClamped(now, months);

  if (anchor > target) {
    months = Math.max(0, months - 1);
    anchor = addCalendarMonthsClamped(now, months);
  }

  const diff = Math.max(0, target - anchor);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return { months, days, hours };
}

const normalizePhotoFit = (value) => {
  if (value === 'fit' || value === 'containFit' || value === 'contain') return 'contain';
  return VALID_PHOTO_FITS.has(value) ? value : 'cover';
};

export function resolveInvitationPhoto(source) {
  if (!source) return { src: '', fit: 'cover' };
  if (typeof source === 'string') return { src: source, fit: 'cover' };

  return {
    src: source.url || source.src || '',
    fit: normalizePhotoFit(source.fit),
  };
}

export function getInvitationPhotoSrc(source) {
  return resolveInvitationPhoto(source).src;
}

export function containInvitationPhoto(source) {
  const resolved = resolveInvitationPhoto(source);
  if (!resolved.src) return source;

  // Story layouts historically defaulted to contain. Preserve that fallback
  // for plain image URLs, but never override an explicit customer selection.
  return {
    src: resolved.src,
    fit: typeof source === 'object' && source?.fit ? resolved.fit : 'contain',
  };
}

export function formatInvitationTime(value, preference = '12h') {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  if (preference === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

export function getGuestPolicyLines(weddingDetails = {}, disabledFields = []) {
  // Each guidance message can be hidden on its own ("childrenNote" / "plusOneNote").
  // The legacy "guestPolicy" key hid both at once, so it still does.
  const disabled = Array.isArray(disabledFields) ? disabledFields : [];
  const allHidden = disabled.includes('guestPolicy');
  const childrenHidden = allHidden || disabled.includes('childrenNote');
  const plusOneHidden = allHidden || disabled.includes('plusOneNote');

  const lines = [];
  if (!childrenHidden) {
    const childrenPolicy = weddingDetails.childrenPolicy || 'welcome';
    lines.push(weddingDetails.childrenPolicyText?.trim()
      || (childrenPolicy === 'adults-only'
        ? 'With love, we kindly request an adults-only celebration.'
        : 'Little ones are warmly welcome to share in the celebration.'));
  }
  if (!plusOneHidden) {
    const plusOnePolicy = weddingDetails.plusOnePolicy || 'named-only';
    lines.push(weddingDetails.plusOnePolicyText?.trim()
      || (plusOnePolicy === 'welcome'
        ? 'You are warmly welcome to bring a guest with you.'
        : DEFAULT_PLUS_ONE_POLICY_TEXT));
  }

  return lines.filter(Boolean);
}

export function getGuestPolicyLine(weddingDetails = {}) {
  return getGuestPolicyLines(weddingDetails).join(' ');
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
