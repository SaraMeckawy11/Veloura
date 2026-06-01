import Rsvp from '../models/Rsvp.js';

export async function syncRsvpIndexes() {
  await Rsvp.collection.createIndex(
    { order: 1, submissionId: 1 },
    { unique: true, sparse: true, name: 'order_1_submissionId_1' }
  );

  const indexes = await Rsvp.collection.indexes();
  if (indexes.some(index => index.name === 'order_1_email_1')) {
    await Rsvp.collection.dropIndex('order_1_email_1');
  }
}
