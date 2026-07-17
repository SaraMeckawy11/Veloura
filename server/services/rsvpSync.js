import mongoose from 'mongoose';
import Rsvp from '../models/Rsvp.js';

const OBSOLETE_INDEX_NAMES = [
  'order_1_submissionId_1',
  'order_1_email_1',
];

async function dropIndexIfPresent(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    // Another server instance may have completed the same startup migration
    // after we listed indexes. MongoDB code 27 means the index is already gone.
    if (error?.code !== 27 && error?.codeName !== 'IndexNotFound') throw error;
  }
}

async function dropObsoleteResponseIndexes() {
  const coll = Rsvp.collection;
  const indexes = await coll.indexes();

  for (const indexName of OBSOLETE_INDEX_NAMES) {
    if (indexes.some(index => index.name === indexName)) {
      await dropIndexIfPresent(coll, indexName);
    }
  }
}

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
  // Drop legacy compound unique indexes before migrating. Consolidated RSVP
  // documents intentionally have no top-level submissionId/email; inserting
  // one while the old index exists makes MongoDB index those fields as null
  // and can trigger E11000 against a legacy row for the same order.
  await dropObsoleteResponseIndexes();
  await migrateLegacyResponses();

  const indexes = await Rsvp.collection.indexes();
  // The old schema indexed `order` non-uniquely; drop it so we can recreate it
  // as unique (one RSVP document per invitation).
  const orderIndex = indexes.find(index => index.name === 'order_1');
  if (orderIndex && !orderIndex.unique) {
    await dropIndexIfPresent(Rsvp.collection, 'order_1');
  }

  await Rsvp.collection.createIndex({ order: 1 }, { unique: true, name: 'order_1' });
}
