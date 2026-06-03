import { tierAllows } from '../lib/pricingTiers';

export function invitationTierAllows(order, section) {
  return tierAllows(order?.pricingTier, section);
}

export function invitationPhotoAllowed(order, photo) {
  if (photo?.label === 'story') return invitationTierAllows(order, 'story');
  if (photo?.label === 'gallery') return invitationTierAllows(order, 'gallery');
  if (!photo?.label) return invitationTierAllows(order, 'gallery');
  return true;
}

export function getTieredInvitationPhotos(order) {
  return (order?.photos || []).filter(photo => invitationPhotoAllowed(order, photo));
}

export function getTieredStoryMilestones(order) {
  return invitationTierAllows(order, 'story') ? (order?.storyMilestones || []) : [];
}
