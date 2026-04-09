import { Router } from 'express';
import Order from '../models/Order.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import { sendMail } from '../config/email.js';
import { orderConfirmationEmail, editLimitWarningEmail } from '../utils/emailTemplates.js';
import { validateOrderBody, validateEditToken } from '../middleware/validateOrder.js';

const router = Router();

const PRICE_USD = process.env.PRICE_USD || '99.00';
const paypalConfigured = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== 'replace_me';

// POST /api/orders — create order + PayPal checkout (or skip payment in dev)
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

    // Find or create User
    let user = await User.findOne({ email: customerEmail.toLowerCase() });
    if (!user) {
      user = new User({
        name: customerName,
        email: customerEmail,
        phone: customerPhone || '',
      });
      await user.save();
    }
    if (!user.orders.includes(order._id)) {
      user.orders.push(order._id);
      await user.save();
    }

    // If PayPal is configured, create a checkout session
    if (paypalConfigured) {
      const { createPayPalOrder } = await import('../config/paypal.js');
      const { paypalOrderId, approvalUrl } = await createPayPalOrder({
        amountUSD: PRICE_USD,
        description: `Eternally — ${template.name} Wedding Invitation`,
        orderId: order._id.toString(),
      });

      order.paypalOrderId = paypalOrderId;
      await order.save();

      return res.status(201).json({
        orderId: order._id,
        paymentUrl: approvalUrl,
      });
    }

    // Dev mode (no PayPal): order stays as draft, let frontend handle confirmation
    res.status(201).json({
      orderId: order._id,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/confirm/:orderId — confirm payment (dev mode)
router.post('/confirm/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus === 'paid') {
      return res.json({ message: 'Already paid', orderId: order._id });
    }

    // Activate the order
    order.amountPaid = paypalConfigured ? PRICE_USD : '0.00';
    order.currency = 'USD';
    await order.activate();

    // Send confirmation email with live links
    try {
      const email = orderConfirmationEmail({
        customerName: order.customerName,
        publicSlug: order.publicSlug,
        editToken: order.editToken,
        weddingDetails: order.weddingDetails,
        isPending: false,
      });
      await sendMail({ to: order.customerEmail, ...email });
      order.confirmationSent = true;
      await order.save();
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr.message);
    }

    res.json({
      message: 'Payment confirmed',
      orderId: order._id,
      publicSlug: order.publicSlug,
      editToken: order.editToken,
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
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
      .select('-editToken -paypalOrderId -paypalCaptureId -customerEmail -editHistory');

    if (!order) return res.status(404).json({ error: 'Invitation not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/dashboard/:editToken — full dashboard data
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
