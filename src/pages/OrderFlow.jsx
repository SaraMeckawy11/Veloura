import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaddle } from '../lib/paddle';
import '../styles/OrderFlow.css';

const API = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY = 'veloura_order_draft';
const PENDING_ORDER_KEY = 'veloura_pending_order_id';
const DISPLAY_PRICE = '$89';

// --- localStorage helpers ---
function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveDraft(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { return undefined; }
}
function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { return undefined; }
}
function savePendingOrder(orderId) {
  try {
    sessionStorage.setItem(PENDING_ORDER_KEY, orderId);
    localStorage.setItem(PENDING_ORDER_KEY, orderId);
  } catch { return undefined; }
}
function clearPendingOrder() {
  try {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    localStorage.removeItem(PENDING_ORDER_KEY);
  } catch { return undefined; }
}
function loadPendingOrder() {
  try {
    return sessionStorage.getItem(PENDING_ORDER_KEY) || localStorage.getItem(PENDING_ORDER_KEY);
  } catch { return null; }
}

const PHOTO_CATEGORIES = [
  { key: 'venue', label: 'Venue Photos', hint: 'Photos of your venue or ceremony location (max 2)', icon: 'location', max: 2 },
  { key: 'story', label: 'Our Story Photos', hint: 'Photos from your journey together — first date, trips, proposal (max 4)', icon: 'book', max: 4 },
  { key: 'gallery', label: 'Gallery Photos', hint: 'Additional photos for the gallery section (max 6)', icon: 'grid', max: 6 },
];

// Local fallback images keyed by slug — used when API images fail to load
const TEMPLATE_PREVIEW_IMAGES = {
  'velvet-rose': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&q=80',
  'golden-hour': 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=600&h=400&fit=crop&q=80',
  'sakura-spring': 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=600&h=400&fit=crop&q=80',
  'dark-romance': 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600&h=400&fit=crop&q=80',
  'pharaonic': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop&q=80',
  'coastal-breeze': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80',
  'boarding-pass': 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=400&fit=crop&q=80',
  'midnight-garden': 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=400&fit=crop&q=80',
  'f1-race': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop&q=80',
  'art-deco-noir': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop&q=80',
  celestial: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop&q=80',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop&q=80',
};

const LANGUAGE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'tr', label: 'Turkish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ur', label: 'Urdu' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'el', label: 'Greek' },
  { value: 'other', label: 'Other' },
];

export default function OrderFlow() {
  const navigate = useNavigate();
  const draft = useRef(loadDraft()).current;

  const [step, setStep] = useState(draft?.step || 1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paddleOrderData, setPaddleOrderData] = useState(null);
  const [paddleLoading, setPaddleLoading] = useState(false);
  const [error, setError] = useState('');
  const paddleFrameRef = useRef(null);

  // Form state — restore from draft
  const defaultForm = {
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
    message: 'This text appears as the tagline under your names in the invitation ',
    language: 'en',
    secondLanguage: '',
  };
  const [form, setForm] = useState(draft?.form || defaultForm);

  const [disabledFields, setDisabledFields] = useState(draft?.disabledFields || []);
  // Photos organized by category — restore uploaded photos from draft
  // Mark any _pendingUpload photos as failed (upload was lost on reload, user must re-add)
  const initPhotos = (() => {
    const raw = draft?.photos || { venue: [], story: [], gallery: [] };
    const result = {};
    for (const cat of Object.keys(raw)) {
      result[cat] = (raw[cat] || []).map(p =>
        p._pendingUpload ? { ...p, _failed: true, _pendingUpload: false } : p
      );
    }
    return result;
  })();
  const [photos, setPhotos] = useState(initPhotos);
  const [uploadError, setUploadError] = useState('');
  // Story milestones — text/date for each story photo
  const [storyMilestones, setStoryMilestones] = useState(
    draft?.storyMilestones || [{ date: '', title: '', description: '' }]
  );

  // --- Auto-save to localStorage on every state change ---
  useEffect(() => {
    const persistablePhotos = {};
    for (const cat of Object.keys(photos)) {
      persistablePhotos[cat] = photos[cat]
        .map(p => {
          // Uploaded to Cloudinary — save the real URL
          if (p.publicId && !p._uploading) {
            return { url: p.url, publicId: p.publicId, label: p.label };
          }
          // Still uploading or failed — save the thumbnail for reload survival
          if (p._thumbUrl) {
            return { url: p._thumbUrl, publicId: '', label: p.label, _pendingUpload: true };
          }
          // No thumbnail available (e.g. HEIC couldn't render) — skip
          return null;
        })
        .filter(Boolean);
    }
    saveDraft({
      step,
      selectedTemplate,
      form,
      disabledFields,
      photos: persistablePhotos,
      storyMilestones,
    });
  }, [step, selectedTemplate, form, disabledFields, photos, storyMilestones]);

  // Local template definitions used as fallback when API is unavailable
  const localTemplates = [
    { _id: 'velvet-rose', name: 'Velvet Rose', slug: 'velvet-rose', envelope: 'Burgundy wax seal breaks open, rose petals scatter', colorScheme: { primary: '#8b2942', secondary: '#f5d5dc', background: '#3d0f1a' } },
    { _id: 'golden-hour', name: 'Golden Hour', slug: 'golden-hour', envelope: 'Gold foil envelope unfolds with a warm light burst', colorScheme: { primary: '#daa520', secondary: '#fff8e7', background: '#8b6914' } },
    { _id: 'sakura-spring', name: 'Sakura Spring', slug: 'sakura-spring', envelope: 'Pale pink envelope opens, cherry blossoms cascade down', colorScheme: { primary: '#f48fb1', secondary: '#880e4f', background: '#fce4ec' } },
    { _id: 'dark-romance', name: 'Dark Romance', slug: 'dark-romance', envelope: 'Dark velvet envelope with blood-red wax seal cracks open', colorScheme: { primary: '#c62828', secondary: '#ffcdd2', background: '#1a1a1a' } },
    { _id: 'pharaonic', name: 'Pharaonic', slug: 'pharaonic', envelope: 'Gold sarcophagus-style envelope with hieroglyphic border unseals', colorScheme: { primary: '#ffd54f', secondary: '#1a237e', background: '#2e1a00' } },
    { _id: 'coastal-breeze', name: 'Coastal Breeze', slug: 'coastal-breeze', envelope: 'Sand-textured envelope washes away like a wave', colorScheme: { primary: '#26a69a', secondary: '#004d40', background: '#e0f2f1' } },
    { _id: 'boarding-pass', name: 'Boarding Pass', slug: 'boarding-pass', envelope: 'Airmail envelope with vintage stamps slides open', colorScheme: { primary: '#42a5f5', secondary: '#0d47a1', background: '#e3f2fd' } },
    { _id: 'midnight-garden', name: 'Midnight Garden', slug: 'midnight-garden', envelope: 'Dark envelope opens, fireflies emerge into the night', colorScheme: { primary: '#b0bec5', secondary: '#cfd8dc', background: '#0d1b2a' } },
    { _id: 'f1-race', name: 'F1 Race', slug: 'f1-race', envelope: 'Racing helmet visor lifts open', colorScheme: { primary: '#b71c1c', secondary: '#f5f5f5', background: '#1a1a1a' } },
    { _id: 'art-deco-noir', name: 'Art Deco Noir', slug: 'art-deco-noir', envelope: 'Black and gold geometric envelope fans open', colorScheme: { primary: '#d4af37', secondary: '#f8f1d4', background: '#111111' } },
    { _id: 'celestial', name: 'Celestial', slug: 'celestial', envelope: 'Star-map envelope dissolves into constellation', colorScheme: { primary: '#90caf9', secondary: '#e3f2fd', background: '#0d1b3e' } },
    { _id: 'cinema', name: 'Cinema', slug: 'cinema', envelope: 'Film strip unrolls from a vintage envelope', colorScheme: { primary: '#ffc857', secondary: '#fff4d6', background: '#1b1b1b' } },
  ];

  const goToSuccessPage = useCallback((orderId) => {
    if (!orderId) return;
    clearDraft();
    clearPendingOrder();
    window.location.assign(`/order/success/${orderId}`);
  }, []);

  useEffect(() => {
    const recoverPaddleHashRedirect = () => {
      if (window.location.hash !== '#!') return;

      const pendingOrderId = loadPendingOrder();
      if (pendingOrderId) {
        goToSuccessPage(pendingOrderId);
        return;
      }

      window.history.replaceState(null, '', '/order');
      setError('Payment finished, but the order id was not available in this browser. Check your email or use My Invitation.');
    };

    recoverPaddleHashRedirect();
    window.addEventListener('hashchange', recoverPaddleHashRedirect);
    return () => window.removeEventListener('hashchange', recoverPaddleHashRedirect);
  }, [goToSuccessPage]);

  useEffect(() => {
    fetch(`${API}/templates`)
      .then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No templates returned');
        }
        const bySlug = new Map(localTemplates.map(template => [template.slug, template]));
        for (const template of data) {
          bySlug.set(template.slug, {
            ...bySlug.get(template.slug),
            ...template,
          });
        }
        const merged = Array.from(bySlug.values()).map(t => ({
          ...t,
          previewImage: t.previewImage || TEMPLATE_PREVIEW_IMAGES[t.slug] || '',
        }));
        setTemplates(merged);
        setLoading(false);
      })
      .catch(() => {
        // Fall back to local template data with local images
        const fallback = localTemplates.map(t => ({
          ...t,
          previewImage: TEMPLATE_PREVIEW_IMAGES[t.slug] || '',
        }));
        setTemplates(fallback);
        setLoading(false);
      });
  }, []);

  const handleInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleField = (key) => {
    setDisabledFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  // Fallback for images the browser can't render natively (e.g. HEIC)
  const handleImgError = (e) => {
    const img = e.target;
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-preview-fallback';
    placeholder.textContent = 'Preview unavailable';
    img.parentElement.appendChild(placeholder);
  };

  // Create a small thumbnail data URL from a File (fits in localStorage without blowing the 5MB limit)
  const fileToThumbUrl = (file) => new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200; // thumbnail size — small enough for localStorage
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
    img.src = blobUrl;
  });

  // Upload a single file to Cloudinary in the background and update photos state
  const uploadFileInBackground = useCallback((file, category, localId) => {
    const fd = new FormData();
    fd.append('photos', file);
    fetch(`${API}/upload?category=${category}`, { method: 'POST', body: fd })
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.files?.[0]) throw new Error(data.error || 'Upload failed');
        // Swap the local preview with the Cloudinary URL
        setPhotos(prev => ({
          ...prev,
          [category]: prev[category].map(p =>
            p._localId === localId
              ? { url: data.files[0].url, publicId: data.files[0].publicId, label: category }
              : p
          ),
        }));
      })
      .catch(() => {
        // Keep the local preview visible but mark as failed — user can retry or remove
        setPhotos(prev => ({
          ...prev,
          [category]: prev[category].map(p =>
            p._localId === localId ? { ...p, _uploading: false, _failed: true } : p
          ),
        }));
        setUploadError('One or more photos failed to upload. You can remove and re-add them.');
      });
  }, []);

  const handlePhotoUpload = async (e, category) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploadError('');

    const catConfig = PHOTO_CATEGORIES.find(c => c.key === category);
    const currentCount = photos[category].length;
    const remaining = catConfig.max - currentCount;
    if (remaining <= 0) {
      setUploadError(`Maximum ${catConfig.max} photos for ${catConfig.label}`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    // Reset input immediately so same file can be re-selected
    e.target.value = '';

    // Create entries with blob URL (fast display) + thumbnail (localStorage persistence)
    const entries = await Promise.all(filesToUpload.map(async (f) => {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const thumbUrl = await fileToThumbUrl(f);
      return { file: f, localId, preview: {
        url: URL.createObjectURL(f),
        publicId: '',
        label: category,
        _uploading: true,
        _localId: localId,
        _thumbUrl: thumbUrl, // small data URL saved to localStorage
      }};
    }));

    // Show previews instantly
    setPhotos(prev => ({
      ...prev,
      [category]: [...prev[category], ...entries.map(p => p.preview)],
    }));

    // Fire-and-forget background uploads for each file
    for (const { file, localId } of entries) {
      uploadFileInBackground(file, category, localId);
    }
  };

  const handleStoryMilestone = (index, key, value) => {
    setStoryMilestones(prev => prev.map((m, i) => i === index ? { ...m, [key]: value } : m));
  };

  const removePhoto = (category, index) => {
    setPhotos(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  // Flatten all photos for submission & review (exclude failed/uploading)
  const allPhotos = Object.entries(photos).flatMap(([cat, items]) =>
    items
      .filter(p => !p._uploading && !p._failed && !p._pendingUpload)
      .map(p => ({ ...p, label: p.label || cat }))
  );

  // Step 2 → Step 3: just validate and move to review (no order created yet)
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setStep(3);
  };

  // Open Paddle inline checkout once the target div is mounted
  useEffect(() => {
    if (!paddleOrderData) return;
    if (!paddleFrameRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const Paddle = await getPaddle({
          ...paddleOrderData.paddle,
          onCheckoutCompleted: () => goToSuccessPage(paddleOrderData.orderId),
        });
        if (cancelled) return;

        Paddle.Checkout.open({
          settings: {
            displayMode: 'inline',
            frameTarget: 'paddle-checkout-frame',
            frameInitialHeight: 500,
            frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
            theme: 'light',
            locale: 'en',
            successUrl: `${window.location.origin}/order/success/${paddleOrderData.orderId}`,
          },
          items: [{ priceId: paddleOrderData.paddle.priceId, quantity: 1 }],
          customer: {
            email: form.customerEmail,
          },
          customData: {
            orderId: paddleOrderData.orderId,
            templateId: selectedTemplate?._id,
            platform: 'veloura',
          },
        });

        // Hide the loading state once Paddle has had a chance to inject the iframe
        setTimeout(() => { if (!cancelled) setPaddleLoading(false); }, 1200);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load payment form');
          setPaddleLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paddleOrderData, goToSuccessPage]);

  // Parse JSON safely — server may return empty body on 502/504/cold-start
  const parseJsonOrThrow = async (res, label) => {
    const text = await res.text();
    if (!text) {
      throw new Error(`${label}: server returned empty response (status ${res.status}). The server may be waking up — please try again in a few seconds.`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${label}: server returned invalid response (status ${res.status}): ${text.slice(0, 200)}`);
    }
  };

  // Step 3: create order + handle payment in one action
  const handleConfirmPayment = async () => {
    setConfirming(true);
    setError('');

    try {
      // Create the order now
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
          photos: allPhotos.filter(p => !p._uploading && !p._failed),
          storyMilestones: storyMilestones.filter(m => m.title || m.date || m.description),
        }),
      });

      const data = await parseJsonOrThrow(res, 'Order creation');
      if (!res.ok) throw new Error(data.error || 'Order failed');

      if (data.paymentProvider === 'paddle' && data.paddle) {
        // Trigger inline payment render. The actual Paddle.Checkout.open call
        // happens in a useEffect once the target frame is mounted.
        savePendingOrder(data.orderId);
        setPaddleOrderData({ orderId: data.orderId, paddle: data.paddle });
        setPaddleLoading(true);
        setConfirming(false);
        return;
      }

      // Dev mode: confirm payment directly
      const confirmRes = await fetch(`${API}/orders/confirm/${data.orderId}`, {
        method: 'POST',
      });
      const confirmData = await parseJsonOrThrow(confirmRes, 'Payment confirmation');
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Payment confirmation failed');

      clearDraft();
      navigate(`/order/success/${data.orderId}`);
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
    { key: 'rsvp', label: 'RSVP Section' },
    // Removed secondLanguage option
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
                    {t.previewImage ? (
                      <img
                        src={t.previewImage}
                        alt={t.name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background =
                            `linear-gradient(135deg, ${t.colorScheme?.primary || '#b8924a'}, ${t.colorScheme?.background || '#2d2a26'})`;
                        }}
                      />
                    ) : (
                      <div
                        className="template-option-fallback"
                        style={{ background: `linear-gradient(135deg, ${t.colorScheme?.primary || '#b8924a'}, ${t.colorScheme?.background || '#2d2a26'})` }}
                      >
                        <span>{t.name}</span>
                      </div>
                    )}
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
                    <div className="field-header">
                      <label>Wedding Date *</label>
                    </div>
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
                        field.key === 'rsvp' ? (
                          <p className="form-hint" style={{ margin: 0 }}>Guests will be able to RSVP directly from your invitation.</p>
                        ) : field.key === 'message' ? (
                          <textarea value={form[field.key]} onChange={e => handleInput(field.key, e.target.value)} rows={3} placeholder={field.label} />
                        ) : (
                          <input type="text" value={form[field.key]} onChange={e => handleInput(field.key, e.target.value)} placeholder={field.label} />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Venue Photos */}
              <fieldset className="form-section">
                <legend>Venue Photos</legend>
                <p className="form-hint">Photos of your venue or ceremony location (max 2)</p>
                {uploadError && <p className="photo-error">{uploadError}</p>}
                <div className="photo-upload-area">
                  {photos.venue.length < 2 && (
                    <label className="photo-upload-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add
                      <input type="file" multiple accept="image/*,.heic,.heif" onChange={e => handlePhotoUpload(e, 'venue')} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />
                    </label>
                  )}
                  {photos.venue.map((photo, i) => (
                    <div key={photo._localId || i} className={`photo-preview ${photo._failed ? 'photo-failed' : ''}`}>
                      <img src={photo.url} alt={`Venue ${i + 1}`} onError={handleImgError} />
                      {photo._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                      {photo._failed && <div className="photo-failed-badge" title="Upload failed — remove and re-add">!</div>}
                      <button type="button" className="photo-remove" onClick={() => removePhoto('venue', i)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Our Story — each milestone has its own text fields + optional photo */}
              <fieldset className="form-section">
                <legend>Our Story</legend>
                <p className="form-hint">Add milestones from your journey together — first date, proposal, and more. Each one appears on your invitation timeline.</p>
                <div className="story-milestones">
                  {storyMilestones.map((milestone, i) => (
                    <div key={i} className="story-milestone-item">
                      <div className="story-milestone-number">{i + 1}</div>
                      {storyMilestones.length > 1 && (
                        <button
                          type="button"
                          className="story-milestone-remove"
                          onClick={() => {
                            setStoryMilestones(prev => prev.filter((_, idx) => idx !== i));
                            setPhotos(prev => ({
                              ...prev,
                              story: prev.story.filter((_, idx) => idx !== i),
                            }));
                          }}
                          title="Remove milestone"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
                      <div className="story-milestone-photo">
                        {photos.story[i] ? (
                          <>
                            <img src={photos.story[i].url} alt={`Story ${i + 1}`} onError={handleImgError} />
                            {photos.story[i]._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                            {photos.story[i]._failed && <div className="photo-failed-badge" title="Upload failed">!</div>}
                            <button type="button" className="photo-remove" onClick={() => removePhoto('story', i)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </>
                        ) : (
                          <label className="photo-upload-btn photo-upload-btn--square">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Photo
                            <input type="file" accept="image/*,.heic,.heif" onChange={async (e) => {
                              const files = e.target.files;
                              if (!files.length) return;
                              setUploadError('');
                              const file = files[0];
                              e.target.value = '';
                              const localId = `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                              const thumbUrl = await fileToThumbUrl(file);
                              setPhotos(prev => {
                                const updated = [...prev.story];
                                updated[i] = { url: URL.createObjectURL(file), publicId: '', label: 'story', _uploading: true, _localId: localId, _thumbUrl: thumbUrl };
                                return { ...prev, story: updated };
                              });
                              // Background upload
                              uploadFileInBackground(file, 'story', localId);
                            }} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />
                          </label>
                        )}
                      </div>
                      <div className="story-milestone-fields">
                        <input type="text" placeholder="Year or date (e.g. 2019)" value={milestone.date} onChange={e => handleStoryMilestone(i, 'date', e.target.value)} />
                        <input type="text" placeholder="Title (e.g. First Meeting)" value={milestone.title} onChange={e => handleStoryMilestone(i, 'title', e.target.value)} />
                        <textarea rows={2} placeholder="A short description of this moment..." value={milestone.description} onChange={e => handleStoryMilestone(i, 'description', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  {storyMilestones.length < 4 && (
                    <button
                      type="button"
                      className="story-add-btn"
                      onClick={() => setStoryMilestones(prev => [...prev, { date: '', title: '', description: '' }])}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add milestone ({storyMilestones.length}/4)
                    </button>
                  )}
                </div>
              </fieldset>

              {/* Gallery Photos */}
              <fieldset className="form-section">
                <legend>Gallery</legend>
                <p className="form-hint">Additional photos for the gallery section (max 6)</p>
                <div className="photo-upload-area">
                  {photos.gallery.length < 6 && (
                    <label className="photo-upload-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add
                      <input type="file" multiple accept="image/*,.heic,.heif" onChange={e => handlePhotoUpload(e, 'gallery')} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />
                    </label>
                  )}
                  {photos.gallery.map((photo, i) => (
                    <div key={photo._localId || i} className={`photo-preview ${photo._failed ? 'photo-failed' : ''}`}>
                      <img src={photo.url} alt={`Gallery ${i + 1}`} onError={handleImgError} />
                      {photo._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                      {photo._failed && <div className="photo-failed-badge" title="Upload failed — remove and re-add">!</div>}
                      <button type="button" className="photo-remove" onClick={() => removePhoto('gallery', i)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Submit */}
              <div className="form-submit">
                <div className="price-summary">
                  <span className="price-label">Total</span>
                  <span className="price-value">{DISPLAY_PRICE}</span>
                </div>
                <button type="submit" className="btn btn-gold form-pay-btn">
                  Review & Pay
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Review & Confirm Payment */}
        {step === 3 && (
          <div className="step-content">
            {!paddleOrderData && (
              <button className="step-back-btn" onClick={() => setStep(2)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back to Details
              </button>
            )}

            <h1 className="step-title">{paddleOrderData ? 'Complete Your Order' : 'Review & Confirm'}</h1>
            <p className="step-subtitle">{paddleOrderData ? 'You\'re one step away from your invitation.' : 'Please review your order details before confirming payment'}</p>

            {!paddleOrderData && (
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
            )}

            {!paddleOrderData && (
              <div className="form-submit review-submit">
                <div className="review-submit-info">
                  <div className="price-summary">
                    <span className="price-label">Total</span>
                    <span className="price-value">{DISPLAY_PRICE}</span>
                  </div>
                  <p className="payment-note">A confirmation email with your invitation link will be sent after payment.</p>
                </div>
                <button className="btn btn-gold form-pay-btn" onClick={handleConfirmPayment} disabled={confirming}>
                  {confirming ? 'Preparing Payment…' : `Continue to Payment — ${DISPLAY_PRICE}`}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            {paddleOrderData && (
              <div className="payment-layout">
                <aside className="payment-summary-card">
                  <div className="payment-summary-header">
                    <span className="payment-summary-eyebrow">Order Summary</span>
                    <h3>{selectedTemplate.name}</h3>
                    <p className="payment-summary-subtitle">Veloura Digital Wedding Invitation</p>
                  </div>
                  {selectedTemplate.previewImage && (
                    <div className="payment-summary-image">
                      <img src={selectedTemplate.previewImage} alt={selectedTemplate.name} />
                    </div>
                  )}
                  <dl className="payment-summary-list">
                    <div className="payment-summary-row">
                      <dt>Couple</dt>
                      <dd>{form.groomName} &amp; {form.brideName}</dd>
                    </div>
                    {form.weddingDate && (
                      <div className="payment-summary-row">
                        <dt>Date</dt>
                        <dd>{new Date(form.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                      </div>
                    )}
                    {form.venue && (
                      <div className="payment-summary-row">
                        <dt>Venue</dt>
                        <dd>{form.venue}</dd>
                      </div>
                    )}
                    <div className="payment-summary-row">
                      <dt>Email</dt>
                      <dd>{form.customerEmail}</dd>
                    </div>
                  </dl>
                  <div className="payment-summary-divider" />
                  <div className="payment-summary-totals">
                    <div className="payment-summary-row">
                      <dt>Subtotal</dt>
                      <dd>{DISPLAY_PRICE}</dd>
                    </div>
                    <div className="payment-summary-row payment-summary-grand">
                      <dt>Total due today</dt>
                      <dd>{DISPLAY_PRICE}</dd>
                    </div>
                  </div>
                  <button type="button" className="payment-summary-edit" onClick={() => { setPaddleOrderData(null); setPaddleLoading(false); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Edit order
                  </button>
                </aside>

                <section className="payment-section">
                  <div className="payment-section-header">
                    <div className="payment-section-title">
                      <span className="payment-lock-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <div>
                        <h3>Payment</h3>
                        <p className="payment-section-subtitle">Encrypted &amp; secure</p>
                      </div>
                    </div>
                  </div>

                  <div className="paddle-checkout-wrap">
                    {paddleLoading && (
                      <div className="paddle-checkout-loading">
                        <div className="redirect-spinner" />
                        <p>Preparing secure checkout…</p>
                      </div>
                    )}
                    <div ref={paddleFrameRef} className="paddle-checkout-frame" />
                  </div>

                  <div className="payment-trust-row">
                    <span className="payment-trust-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      256-bit encryption
                    </span>
                    <span className="payment-trust-divider">•</span>
                    <span className="payment-trust-item">PCI-DSS compliant</span>
                    <span className="payment-trust-divider">•</span>
                    <span className="payment-trust-item">Confirmation email after payment</span>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
