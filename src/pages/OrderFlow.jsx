import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OrderFlow.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const PHOTO_CATEGORIES = [
  { key: 'couple', label: 'Couple Photos', hint: 'Upload your best couple photos (max 3)', icon: 'heart', max: 3 },
  { key: 'venue', label: 'Venue Photos', hint: 'Photos of your venue or ceremony location (max 2)', icon: 'location', max: 2 },
  { key: 'story', label: 'Our Story Photos', hint: 'Photos from your journey together — first date, trips, proposal (max 4)', icon: 'book', max: 4 },
  { key: 'gallery', label: 'Gallery Photos', hint: 'Additional photos for the gallery section (max 6)', icon: 'grid', max: 6 },
];

export default function OrderFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Form state
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    groomName: '',
    brideName: '',
    weddingDate: '',
    weddingTime: '',
    venue: '',
    venueAddress: '',
    venueMapUrl: '',
    message: 'Request the pleasure of your company at our wedding celebration',
    language: 'en',
    secondLanguage: '',
  });

  const [disabledFields, setDisabledFields] = useState([]);
  // Photos organized by category
  const [photos, setPhotos] = useState({ couple: [], venue: [], story: [], gallery: [] });
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    fetch(`${API}/templates`)
      .then(r => r.json())
      .then(data => { setTemplates(data); setLoading(false); })
      .catch(() => { setError('Failed to load templates'); setLoading(false); });
  }, []);

  const handleInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleField = (key) => {
    setDisabledFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const handlePhotoUpload = async (e, category) => {
    const files = e.target.files;
    if (!files.length) return;

    const catConfig = PHOTO_CATEGORIES.find(c => c.key === category);
    const currentCount = photos[category].length;
    const remaining = catConfig.max - currentCount;
    if (remaining <= 0) {
      setError(`Maximum ${catConfig.max} photos for ${catConfig.label}`);
      return;
    }

    setUploading(prev => ({ ...prev, [category]: true }));
    const formData = new FormData();
    const filesToUpload = Array.from(files).slice(0, remaining);
    for (const f of filesToUpload) formData.append('photos', f);

    try {
      const res = await fetch(`${API}/upload?category=${category}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.files) {
        setPhotos(prev => ({
          ...prev,
          [category]: [...prev[category], ...data.files],
        }));
      }
    } catch {
      setError('Photo upload failed');
    }
    setUploading(prev => ({ ...prev, [category]: false }));
  };

  const removePhoto = (category, index) => {
    setPhotos(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  // Flatten all photos for submission
  const allPhotos = Object.entries(photos).flatMap(([cat, items]) =>
    items.map(p => ({ ...p, label: p.label || cat }))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          templateId: selectedTemplate._id,
          weddingDetails: {
            groomName: form.groomName,
            brideName: form.brideName,
            weddingDate: form.weddingDate || undefined,
            weddingTime: form.weddingTime || undefined,
            venue: form.venue,
            venueAddress: form.venueAddress || undefined,
            venueMapUrl: form.venueMapUrl || undefined,
            message: form.message || undefined,
            language: form.language,
            secondLanguage: form.secondLanguage || undefined,
          },
          disabledFields,
          photos: allPhotos,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');

      setOrderData(data);
      setStep(3);
      setSubmitting(false);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    setError('');

    try {
      if (orderData.paymentUrl && !orderData.paymentUrl.includes('/order/success/')) {
        window.location.href = orderData.paymentUrl;
        return;
      }

      const res = await fetch(`${API}/orders/confirm/${orderData.orderId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment confirmation failed');

      navigate(`/order/success/${orderData.orderId}`);
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  const optionalFields = [
    { key: 'weddingTime', label: 'Wedding Time' },
    { key: 'venueAddress', label: 'Venue Address' },
    { key: 'venueMapUrl', label: 'Google Maps Link' },
    { key: 'message', label: 'Personal Message' },
    { key: 'secondLanguage', label: 'Second Language Text' },
  ];

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-container">
          <div className="order-loading">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="order-container">
        {/* Header */}
        <a href="/" className="order-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </a>

        {/* Progress bar */}
        <div className="order-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-dot">1</div>
            <span>Choose Design</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-dot">2</div>
            <span>Your Details</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-dot">3</div>
            <span>Payment</span>
          </div>
        </div>

        {error && <div className="order-error">{error}</div>}

        {/* Step 1: Select template */}
        {step === 1 && (
          <div className="step-content">
            <h1 className="step-title">Choose Your Invitation Design</h1>
            <p className="step-subtitle">Select the theme that matches your wedding vision</p>

            <div className="template-grid">
              {templates.map(t => (
                <button
                  key={t._id}
                  className={`template-option ${selectedTemplate?._id === t._id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <div className="template-option-image">
                    <img src={t.previewImage} alt={t.name} />
                    {selectedTemplate?._id === t._id && (
                      <div className="template-selected-badge">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="template-option-info">
                    <h3>{t.name}</h3>
                    <p>{t.envelope}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="step-actions">
              <button
                className="btn btn-gold step-next"
                disabled={!selectedTemplate}
                onClick={() => setStep(2)}
              >
                Continue with {selectedTemplate?.name || '...'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Fill form */}
        {step === 2 && (
          <div className="step-content">
            <button className="step-back-btn" onClick={() => setStep(1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Change template
            </button>

            <div className="selected-template-banner">
              <img src={selectedTemplate.previewImage} alt={selectedTemplate.name} />
              <div>
                <h3>{selectedTemplate.name}</h3>
                <p>{selectedTemplate.description}</p>
              </div>
            </div>

            <h1 className="step-title">Your Wedding Details</h1>
            <p className="step-subtitle">Fill in the details for your invitation. Toggle off any field you don't need.</p>

            <form onSubmit={handleSubmit} className="order-form">
              {/* Contact info */}
              <fieldset className="form-section">
                <legend>Your Contact Info</legend>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Your Full Name *</label>
                    <input type="text" required value={form.customerName} onChange={e => handleInput('customerName', e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="form-field">
                    <label>Email Address *</label>
                    <input type="email" required value={form.customerEmail} onChange={e => handleInput('customerEmail', e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input type="tel" value={form.customerPhone} onChange={e => handleInput('customerPhone', e.target.value)} placeholder="+20 xxx xxx xxxx" />
                  </div>
                </div>
              </fieldset>

              {/* Couple info */}
              <fieldset className="form-section">
                <legend>Couple Details</legend>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Partner 1 Name *</label>
                    <input type="text" required value={form.groomName} onChange={e => handleInput('groomName', e.target.value)} placeholder="First partner's name" />
                  </div>
                  <div className="form-field">
                    <label>Partner 2 Name *</label>
                    <input type="text" required value={form.brideName} onChange={e => handleInput('brideName', e.target.value)} placeholder="Second partner's name" />
                  </div>
                </div>
              </fieldset>

              {/* Wedding details */}
              <fieldset className="form-section">
                <legend>Wedding Details</legend>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Wedding Date *</label>
                    <input type="date" required value={form.weddingDate} onChange={e => handleInput('weddingDate', e.target.value)} />
                  </div>
                  <div className={`form-field ${disabledFields.includes('weddingTime') ? 'field-disabled' : ''}`}>
                    <div className="field-header">
                      <label>Wedding Time</label>
                      <button type="button" className="field-toggle" onClick={() => toggleField('weddingTime')}>
                        {disabledFields.includes('weddingTime') ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                    {!disabledFields.includes('weddingTime') && (
                      <input type="time" value={form.weddingTime} onChange={e => handleInput('weddingTime', e.target.value)} />
                    )}
                  </div>
                  <div className="form-field">
                    <label>Venue Name *</label>
                    <input type="text" required value={form.venue} onChange={e => handleInput('venue', e.target.value)} placeholder="e.g. The Grand Pavilion" />
                  </div>
                  {optionalFields.filter(f => f.key !== 'weddingTime').map(field => (
                    <div key={field.key} className={`form-field ${disabledFields.includes(field.key) ? 'field-disabled' : ''}`}>
                      <div className="field-header">
                        <label>{field.label}</label>
                        <button type="button" className="field-toggle" onClick={() => toggleField(field.key)}>
                          {disabledFields.includes(field.key) ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                      {!disabledFields.includes(field.key) && (
                        field.key === 'message' || field.key === 'secondLanguage' ? (
                          <textarea value={form[field.key]} onChange={e => handleInput(field.key, e.target.value)} rows={3} placeholder={field.label} />
                        ) : (
                          <input type="text" value={form[field.key]} onChange={e => handleInput(field.key, e.target.value)} placeholder={field.label} />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Photos — categorized */}
              <fieldset className="form-section">
                <legend>Photos</legend>
                <p className="form-hint">Upload photos for different sections of your invitation. Each category appears in its own section.</p>

                {PHOTO_CATEGORIES.map(cat => (
                  <div key={cat.key} className="photo-category">
                    <div className="photo-category-header">
                      <div>
                        <h4 className="photo-category-title">{cat.label}</h4>
                        <p className="photo-category-hint">{cat.hint}</p>
                      </div>
                      <span className="photo-category-count">{photos[cat.key].length}/{cat.max}</span>
                    </div>
                    <div className="photo-upload-area">
                      {photos[cat.key].length < cat.max && (
                        <label className="photo-upload-btn">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          {uploading[cat.key] ? 'Uploading...' : 'Add'}
                          <input type="file" multiple accept="image/*" onChange={e => handlePhotoUpload(e, cat.key)} disabled={uploading[cat.key]} hidden />
                        </label>
                      )}
                      {photos[cat.key].map((photo, i) => (
                        <div key={i} className="photo-preview">
                          <img src={photo.url} alt={`${cat.label} ${i + 1}`} />
                          <button type="button" className="photo-remove" onClick={() => removePhoto(cat.key, i)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </fieldset>

              {/* Submit */}
              <div className="form-submit">
                <div className="price-summary">
                  <span className="price-label">Total</span>
                  <span className="price-value">$99</span>
                </div>
                <button type="submit" className="btn btn-gold form-pay-btn" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Proceed to Payment'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Review & Confirm Payment */}
        {step === 3 && (
          <div className="step-content">
            <button className="step-back-btn" onClick={() => setStep(2)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Details
            </button>

            <h1 className="step-title">Review & Confirm</h1>
            <p className="step-subtitle">Please review your order details before confirming payment</p>

            <div className="review-card">
              <div className="review-section">
                <h3 className="review-section-title">Selected Design</h3>
                <div className="review-template">
                  <img src={selectedTemplate.previewImage} alt={selectedTemplate.name} />
                  <div>
                    <strong>{selectedTemplate.name}</strong>
                    <p>{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h3 className="review-section-title">Contact Info</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Name</span><span>{form.customerName}</span></div>
                  <div className="review-item"><span className="review-label">Email</span><span>{form.customerEmail}</span></div>
                  {form.customerPhone && <div className="review-item"><span className="review-label">Phone</span><span>{form.customerPhone}</span></div>}
                </div>
              </div>

              <div className="review-section">
                <h3 className="review-section-title">Wedding Details</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Partner 1</span><span>{form.groomName}</span></div>
                  <div className="review-item"><span className="review-label">Partner 2</span><span>{form.brideName}</span></div>
                  {form.weddingDate && <div className="review-item"><span className="review-label">Date</span><span>{new Date(form.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>}
                  {form.weddingTime && !disabledFields.includes('weddingTime') && <div className="review-item"><span className="review-label">Time</span><span>{form.weddingTime}</span></div>}
                  <div className="review-item"><span className="review-label">Venue</span><span>{form.venue}</span></div>
                  {form.venueAddress && !disabledFields.includes('venueAddress') && <div className="review-item"><span className="review-label">Address</span><span>{form.venueAddress}</span></div>}
                </div>
              </div>

              {allPhotos.length > 0 && (
                <div className="review-section">
                  <h3 className="review-section-title">Photos ({allPhotos.length})</h3>
                  <div className="review-photos">
                    {allPhotos.map((p, i) => (
                      <div key={i} className="review-photo-item">
                        <img src={p.url} alt={`Photo ${i + 1}`} className="review-photo" />
                        <span className="review-photo-label">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-submit review-submit">
              <div className="review-submit-info">
                <div className="price-summary">
                  <span className="price-label">Total</span>
                  <span className="price-value">$99</span>
                </div>
                <p className="payment-note">A confirmation email with your invitation link will be sent after payment.</p>
              </div>
              <button className="btn btn-gold form-pay-btn" onClick={handleConfirmPayment} disabled={confirming}>
                {confirming ? 'Processing Payment...' : 'Confirm & Pay $99'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
