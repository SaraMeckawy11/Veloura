import User from '../models/User.js';

// Backfill invitationCount for users created before the field existed, setting
// it to the number of orders linked to each user. Idempotent — only touches
// users whose stored count is missing or out of sync.
export async function syncUserInvitationCounts() {
  const result = await User.updateMany(
    {
      $expr: {
        $ne: [
          { $ifNull: ['$invitationCount', -1] },
          { $size: { $ifNull: ['$orders', []] } },
        ],
      },
    },
    [
      { $set: { invitationCount: { $size: { $ifNull: ['$orders', []] } } } },
    ]
  );
  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}
