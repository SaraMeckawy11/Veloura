import { Router } from 'express';
import Order from '../models/Order.js';
import Template from '../models/Template.js';
import { getPaymobToken, createPaymobOrder, getPaymentKey } from '../config/paymob.js';
import { sendMail } from '../config/email.js';
import { editLimitWarningEmail } from '../utils/emailTemplates.js';
import { validateOrderBody, validateEditToken } from '../middleware/validateOrder.js';

const router = Router();

const PRICE_EGP = Number(process.env.PRICE_EGP || 4900); // price in EGP (e.g. 4900 = 4900 EGP)
const PRICE_PIASTERS = PRICE_EGP * 100; // Paymob uses piasters

// POST /api/orders — create order + get Paymob payment iframe URL
router.post('/', validateOrderBody, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, templateId, weddingDetails, customizations, disabledFields, colorOverrides, photos, musicUrl } = req.body;

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // Create order in draft state
    const order = new Order({
      customerName,
      customerEmail,
      template: templateId,
      weddingDetails,
      customizations: customizations || {},
      disabledFields: disabledFields || [],
      colorOverrides: colorOverrides || {},
      photos: photos || [],
      musicUrl,
    });
    await order.save();

    // Paymob flow: auth → create order → get payment key
    const authToken = await getPaymobToken();

    const paymobOrder = await createPaymobOrder(authToken, {
      amountCents: PRICE_PIASTERS,
      merchantOrderId: order._id.toString(),
    });

    order.paymobOrderId = String(paymobOrder.id);
    await order.save();

    const nameParts = customerName.trim().split(' ');
    const paymentKey = await getPaymentKey(authToken, {
      orderId: paymobOrder.id,
      amountCents: PRICE_PIASTERS,
      customer: {
        firstName: nameParts[0] || 'N/A',
        lastName: nameParts.slice(1).join(' ') || 'N/A',
        email: customerEmail,
        phone: customerPhone || 'N/A',
      },
    });

    // Build iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    res.status(201).json({
      orderId: order._id,
      paymentUrl: iframeUrl,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/status/:orderId — check payment status after redirect
router.get('/status/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('template', 'name slug previewImage');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      publicSlug: order.publicSlug,
      editToken: order.paymentStatus === 'paid' ? order.editToken : undefined,
      template: order.template,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/edit/:editToken — get order for editing (magic link)
router.get('/edit/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken })
      .populate('template');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      weddingDetails: order.weddingDetails,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      musicUrl: order.musicUrl,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      editsRemaining: order.editsRemaining,
      expiresAt: order.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/edit/:editToken — update order (decrement edits)
router.put('/edit/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.canEdit()) {
      return res.status(403).json({
        error: 'Edits not allowed',
        reason: order.editsRemaining <= 0 ? 'No edits remaining' : 'Invitation expired or inactive',
      });
    }

    const { weddingDetails, customizations, disabledFields, colorOverrides, photos, musicUrl, musicEnabled } = req.body;
    const fieldsChanged = [];

    if (weddingDetails) {
      const existing = order.weddingDetails?.toObject?.() || order.weddingDetails || {};
      order.weddingDetails = { ...existing, ...weddingDetails };
      fieldsChanged.push('weddingDetails');
    }
    if (customizations) {
      for (const [k, v] of Object.entries(customizations)) order.customizations.set(k, v);
      fieldsChanged.push('customizations');
    }
    if (disabledFields) { order.disabledFields = disabledFields; fieldsChanged.push('disabledFields'); }
    if (colorOverrides) { order.colorOverrides = { ...order.colorOverrides, ...colorOverrides }; fieldsChanged.push('colorOverrides'); }
    if (photos) { order.photos = photos; fieldsChanged.push('photos'); }
    if (musicUrl !== undefined) { order.musicUrl = musicUrl; fieldsChanged.push('musicUrl'); }
    if (musicEnabled !== undefined) { order.musicEnabled = musicEnabled; fieldsChanged.push('musicEnabled'); }

    order.editsRemaining -= 1;
    order.editHistory.push({ fieldsChanged });
    await order.save();

    // Warn when edits are running low
    if (order.editsRemaining <= 2 && order.editsRemaining > 0) {
      const email = editLimitWarningEmail({
        customerName: order.customerName,
        editsRemaining: order.editsRemaining,
        editToken: order.editToken,
      });
      sendMail({ to: order.customerEmail, ...email }).catch(console.error);
    }

    res.json({ message: 'Invitation updated', editsRemaining: order.editsRemaining });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/invite/:publicSlug — public invitation page data
router.get('/invite/:publicSlug', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.publicSlug, status: 'active' })
      .populate('template')
      .select('-editToken -paymobOrderId -paymobTransactionId -customerEmail -editHistory');

    if (!order) return res.status(404).json({ error: 'Invitation not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/dashboard/:editToken — full dashboard data for the couple
router.get('/dashboard/:editToken', validateEditToken, async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken })
      .populate('template');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      id: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      template: order.template,
      weddingDetails: order.weddingDetails,
      customizations: order.customizations,
      disabledFields: order.disabledFields,
      colorOverrides: order.colorOverrides,
      photos: order.photos,
      musicUrl: order.musicUrl,
      musicEnabled: order.musicEnabled,
      publicSlug: order.publicSlug,
      editsRemaining: order.editsRemaining,
      editHistory: order.editHistory,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
