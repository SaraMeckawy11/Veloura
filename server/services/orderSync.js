import Order from '../models/Order.js';

export async function syncOrderTemplateMetadata() {
  const orders = await Order.find({
    $or: [
      { templateSlug: { $exists: true } },
      { templateName: { $exists: false } },
      { templateName: null },
      { templateName: '' },
    ],
  })
    .populate('template', 'name')
    .select('_id template templateName')
    .lean();

  if (!orders.length) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const operations = orders.map((order) => {
    const update = { $unset: { templateSlug: 1 } };

    if (!order.templateName && order.template?.name) {
      update.$set = { templateName: order.template.name };
    }

    return {
      updateOne: {
        filter: { _id: order._id },
        update,
      },
    };
  });

  const result = await Order.bulkWrite(operations, { ordered: false });
  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}
