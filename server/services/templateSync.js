import Template from '../models/Template.js';
import { fallbackTemplates } from '../data/templateFallbacks.js';

export async function syncDefaultTemplates() {
  const operations = fallbackTemplates.map(template => ({
    updateOne: {
      filter: { slug: template.slug },
      update: { $set: template },
      upsert: true,
    },
  }));

  if (operations.length === 0) return { matchedCount: 0, upsertedCount: 0 };

  const result = await Template.bulkWrite(operations, { ordered: false });
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
  };
}
