import { Router } from 'express';
import Rsvp from '../models/Rsvp.js';
import Order from '../models/Order.js';
import { tierAllows } from '../data/pricingTiers.js';

const router = Router();

// POST /api/rsvps/:publicSlug — guest submits RSVP
router.post('/:publicSlug', async (req, res) => {
  try {
    const order = await Order.findOne({ publicSlug: req.params.publicSlug, status: 'active' });
    if (!order) return res.status(404).json({ error: 'Invitation not found' });

    // Check if RSVP is disabled for this invitation
    if (order.disabledFields?.includes('rsvp') || !tierAllows(order.pricingTier, 'rsvp')) {
      return res.status(403).json({ error: 'RSVP is not enabled for this invitation' });
    }

    const { guestName, email, phone, attending, plusOne, plusOneName, guestCount, dietaryPreferences, message } = req.body;
    const submissionId = `${req.body.submissionId || ''}`.trim().slice(0, 128) || undefined;

    if (!guestName?.trim()) return res.status(400).json({ error: 'Guest name is required' });
    if (!['yes', 'no', 'maybe'].includes(attending)) return res.status(400).json({ error: 'Invalid attending value' });

    const rsvpDetails = {
      order: order._id,
      submissionId,
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
    };
    const rsvp = submissionId
      ? await Rsvp.findOneAndUpdate(
        { order: order._id, submissionId },
        { $setOnInsert: rsvpDetails },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      : await Rsvp.create(rsvpDetails);

    // No per-RSVP email notification — responses are surfaced in the
    // couple's dashboard instead of emailing on every submission.

    res.status(201).json({ message: 'RSVP recorded', rsvp });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This RSVP was already recorded. Please refresh the invitation before sending another response.' });
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

    const attendingResponses = rsvps.filter(r => r.attending === 'yes');
    const attending = attendingResponses.length;
    const notAttending = rsvps.filter(r => r.attending === 'no').length;
    // Plus-ones only count for guests who are actually attending.
    const plusOnes = attendingResponses.filter(r => r.plusOne).length;
    const summary = {
      attending,
      notAttending,
      plusOnes,
      totalResponses: rsvps.length,
      totalGuests: attendingResponses.reduce((sum, r) => sum + (r.guestCount || 1) + (r.plusOne ? 1 : 0), 0),
    };

    res.json({ summary, rsvps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
