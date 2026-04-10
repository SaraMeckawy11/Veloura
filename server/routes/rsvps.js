import { Router } from 'express';
import Rsvp from '../models/Rsvp.js';
import Order from '../models/Order.js';
import { sendMail } from '../config/email.js';
import { rsvpNotificationEmail } from '../utils/emailTemplates.js';

const router = Router();

// POST /api/rsvps/:publicSlug — guest submits RSVP
router.post('/:publicSlug', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.publicSlug, status: 'active' });
    if (!order) return res.status(404).json({ error: 'Invitation not found' });

    // Check if RSVP is disabled for this invitation
    if (order.disabledFields?.includes('rsvp')) {
      return res.status(403).json({ error: 'RSVP is not enabled for this invitation' });
    }

    const { guestName, email, phone, attending, plusOne, plusOneName, guestCount, dietaryPreferences, message } = req.body;

    if (!guestName?.trim()) return res.status(400).json({ error: 'Guest name is required' });
    if (!['yes', 'no', 'maybe'].includes(attending)) return res.status(400).json({ error: 'Invalid attending value' });

    // Upsert — if guest with same email already RSVP'd, update it
    const filter = email ? { order: order._id, email } : { order: order._id, guestName };
    const rsvp = await Rsvp.findOneAndUpdate(
      filter,
      {
        order: order._id,
        guestName,
        email,
        phone,
        attending,
        plusOne: plusOne || false,
        plusOneName,
        guestCount: guestCount || 1,
        dietaryPreferences,
        message,
        respondedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify the couple via email
    const notification = rsvpNotificationEmail({
      customerName: order.customerName,
      guestName,
      attending,
      guestCount: guestCount || 1,
      message,
    });
    sendMail({ to: order.customerEmail, ...notification }).catch(console.error);

    res.status(201).json({ message: 'RSVP recorded', rsvp });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already RSVP\'d. Your response has been updated.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rsvps/dashboard/:editToken — couple views all RSVPs
router.get('/dashboard/:editToken', async (req, res) => {
  try {
    const order = await Order.findOne({ editToken: req.params.editToken });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const rsvps = await Rsvp.find({ order: order._id }).sort({ respondedAt: -1 });

    const summary = {
      total: rsvps.length,
      attending: rsvps.filter(r => r.attending === 'yes').length,
      notAttending: rsvps.filter(r => r.attending === 'no').length,
      maybe: rsvps.filter(r => r.attending === 'maybe').length,
      totalGuests: rsvps
        .filter(r => r.attending === 'yes')
        .reduce((sum, r) => sum + r.guestCount, 0),
    };

    res.json({ summary, rsvps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
