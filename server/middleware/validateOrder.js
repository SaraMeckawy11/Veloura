// Validates the order creation payload
export function validateOrderBody(req, res, next) {
  const { customerName, customerEmail, templateId, weddingDetails } = req.body;
  const errors = [];
  const normalizedEmail = typeof customerEmail === 'string' ? customerEmail.trim().toLowerCase() : '';

  if (!customerName?.trim()) errors.push('customerName is required');
  if (!normalizedEmail) errors.push('customerEmail is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) errors.push('Invalid email format');
  if (!templateId) errors.push('templateId is required');
  if (!weddingDetails?.groomName?.trim() && !weddingDetails?.brideName?.trim()) {
    errors.push('At least one partner name is required');
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  req.body.customerName = customerName.trim();
  req.body.customerEmail = normalizedEmail;

  next();
}

// Validates edit token and loads the order
export function validateEditToken(req, res, next) {
  const { editToken } = req.params;
  if (!editToken || editToken.length < 32) {
    return res.status(400).json({ error: 'Invalid edit token' });
  }
  next();
}
