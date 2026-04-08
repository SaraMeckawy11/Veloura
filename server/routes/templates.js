import { Router } from 'express';
import Template from '../models/Template.js';

const router = Router();

// GET /api/templates — list all active templates
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { active: true };
    if (category && category !== 'all') filter.category = category;

    const templates = await Template.find(filter)
      .select('name slug category description envelope previewImage thumbnailImage colorScheme placeholders')
      .sort({ category: 1, name: 1 });

    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/templates/:slug — get a single template with full details
router.get('/:slug', async (req, res) => {
  try {
    const template = await Template.findOne({ slug: req.params.slug, active: true });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
