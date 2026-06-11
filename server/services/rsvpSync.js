import mongoose from 'mongoose';
import Rsvp from '../models/Rsvp.js';

// Consolidate any legacy one-document-per-response RSVP rows into the current
// one-document-per-invitation shape (an `order` with an embedded `responses`
// array). Legacy rows are identified by a top-level `guestName` field, which
// the new shape never has. Idempotent: once migrated, no such rows remain.
async function migrateLegacyResponses() {
  const coll = Rsvp.collection;
  const legacy = await coll.find({ guestName: { $exists: true } }).toArray();
  if (legacy.length === 0) return 0;

  const byOrder = new Map();
  for (const doc of legacy) {
    const key = String(doc.order);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(doc);
  }

  for (const docs of byOrder.values()) {
    const order = docs[0].order;
    const responses = docs.map(doc => ({
      _id: new mongoose.Types.ObjectId(),
      submissionId: doc.submissionId,
      guestName: doc.guestName,
      email: doc.email,
      phone: doc.phone,
      attending: doc.attending,
      plusOne: doc.plusOne || false,
      plusOneName: doc.plusOneName,
      guestCount: doc.guestCount || 1,
      dietaryPreferences: doc.dietaryPreferences,
      message: doc.message,
      respondedAt: doc.respondedAt || doc.createdAt || new Date(),
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    }));

    const existing = await coll.findOne({ order, responses: { $exists: true } });
    if (existing) {
      await coll.updateOne({ _id: existing._id }, { $push: { responses: { $each: responses } } });
    } else {
      await coll.insertOne({ order, responses, createdAt: new Date(), updatedAt: new Date() });
    }
    await coll.deleteMany({ _id: { $in: docs.map(d => d._id) } });
  }

  return legacy.length;
}

export async function syncRsvpIndexes() {
  await migrateLegacyResponses();

  const indexes = await Rsvp.collection.indexes();
  // Drop the obsolete per-response uniqueness index.
  if (indexes.some(index => index.name === 'order_1_submissionId_1')) {
    await Rsvp.collection.dropIndex('order_1_submissionId_1');
  }
  if (indexes.some(index => index.name === 'order_1_email_1')) {
    await Rsvp.collection.dropIndex('order_1_email_1');
  }
  // The old schema indexed `order` non-uniquely; drop it so we can recreate it
  // as unique (one RSVP document per invitation).
  const orderIndex = indexes.find(index => index.name === 'order_1');
  if (orderIndex && !orderIndex.unique) {
    await Rsvp.collection.dropIndex('order_1');
  }

  await Rsvp.collection.createIndex({ order: 1 }, { unique: true, name: 'order_1' });
}
