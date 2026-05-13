import Template from '../models/Template.js';
import { fallbackTemplates, retiredTemplateSlugs } from '../data/templateFallbacks.js';

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
  const retiredResult = retiredTemplateSlugs.length
    ? await Template.updateMany(
      { slug: { $in: retiredTemplateSlugs } },
      { $set: { active: false, category: 'future' } }
    )
    : { matchedCount: 0, modifiedCount: 0 };

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount + retiredResult.modifiedCount,
    upsertedCount: result.upsertedCount,
    retiredCount: retiredResult.modifiedCount,
  };
}
