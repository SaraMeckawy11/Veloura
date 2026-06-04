// Legacy orders used a single "guestPolicy" disable key to hide both guest
// guidance notes at once. Each note now toggles independently ("childrenNote"
// for the children note, "plusOneNote" for the bringing-a-guest note), so when
// we load older data we expand the old key into the two new ones (and drop it)
// before editing. getGuestPolicyLines() still honours the legacy key at render
// time, so already-published invitations keep working until they are re-saved.
export function migrateGuestPolicyFields(fields = []) {
  const list = Array.isArray(fields) ? fields : [];
  if (!list.includes('guestPolicy')) return [...list];
  return [...new Set([
    ...list.filter(key => key !== 'guestPolicy'),
    'childrenNote',
    'plusOneNote',
  ])];
}
