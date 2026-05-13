import { useState, useEffect, useRef, useCallback } from 'react';
import { getPaypal } from '../lib/paypal';
import '../styles/OrderFlow.css';

const API = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY = 'veloura_order_draft';
const PENDING_ORDER_KEY = 'veloura_pending_order_id';
const DISPLAY_PRICE = '$89';
const DEFAULT_INVITATION_MESSAGE = 'Two Souls, One Destination.';
const OLD_MESSAGE_HELP_TEXT = 'This text appears as the tagline under your names in the invitation ';

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Today as YYYY-MM-DD in local time — used as the min for the wedding date picker
const todayISO = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

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
  'coastal-breeze': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80',
  'gazebo-garden': '/assets/gazebo-watercolor-poster1.jpg',
  'boarding-pass': 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=400&fit=crop&q=80',
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
  const draft = useRef(loadDraft()).current;

  const [step, setStep] = useState(draft?.step || 1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paypalOrderData, setPaypalOrderData] = useState(null);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [needsRetry, setNeedsRetry] = useState(false);
  const [paypalSdk, setPaypalSdk] = useState(null);
  const [error, setError] = useState('');
  const paypalButtonRef = useRef(null);

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
    message: '',
    language: 'en',
    secondLanguage: '',
  };
  const [form, setForm] = useState(() => {
    const restored = draft?.form || defaultForm;
    return {
      ...restored,
      message: restored.message === OLD_MESSAGE_HELP_TEXT ? '' : (restored.message || ''),
    };
  });

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
  const [music] = useState(draft?.music || {
    url: '',
    publicId: '',
    name: '',
    enabled: true,
    uploading: false,
    failed: false,
  });
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
      music,
    });
  }, [step, selectedTemplate, form, disabledFields, photos, storyMilestones, music]);

  // Local template definitions used as fallback when API is unavailable
  const localTemplates = [
    { _id: 'coastal-breeze', name: 'Coastal Breeze', slug: 'coastal-breeze', category: 'launch', envelope: 'Blue envelope opens to a bride and groom walking toward the sea', colorScheme: { primary: '#1f5f8f', secondary: '#ec866f', background: '#fffaf1' } },
    { _id: 'gazebo-garden', name: 'Garden Pavilion', slug: 'gazebo-garden', category: 'launch', envelope: 'Animated envelope opens into a watercolor garden gazebo with a bird in flight', colorScheme: { primary: '#86ad61', secondary: '#fff8ea', background: '#eff8dc' } },
    { _id: 'boarding-pass', name: 'Boarding Pass', slug: 'boarding-pass', category: 'launch', envelope: 'Airmail envelope with vintage stamps slides open', colorScheme: { primary: '#42a5f5', secondary: '#0d47a1', background: '#e3f2fd' } },
  ];

  const goToSuccessPage = useCallback((orderId) => {
    if (!orderId) return;
    clearDraft();
    clearPendingOrder();
    window.location.assign(`/order/success/${orderId}`);
  }, []);

  useEffect(() => {
    // PayPal Buttons keeps the user on this page (no top-level redirect), so
    // there's no hash to recover from. We only run a pending-order check on
    // mount in case the page was reloaded mid-checkout and we already have
    // a captured order on the server side.
    const pendingOrderId = loadPendingOrder();
    if (!pendingOrderId) return;

    fetch(`${API}/orders/status/${pendingOrderId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.paymentStatus === 'paid') goToSuccessPage(pendingOrderId);
      })
      .catch(() => {});
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
        const merged = Array.from(bySlug.values())
          .filter(t => t.category === 'launch')
          .map(t => ({
            ...t,
            previewImage: t.previewImage || TEMPLATE_PREVIEW_IMAGES[t.slug] || '',
          }));
        setTemplates(merged);
        if (selectedTemplate && !merged.some(t => t.slug === selectedTemplate.slug)) {
          setSelectedTemplate(merged[0] || null);
        } else if (!selectedTemplate && merged.length > 0) {
          setSelectedTemplate(merged[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fall back to local template data with local images
        const fallback = localTemplates
          .filter(t => t.category === 'launch')
          .map(t => ({
            ...t,
            previewImage: TEMPLATE_PREVIEW_IMAGES[t.slug] || '',
          }));
        setTemplates(fallback);
        if (!selectedTemplate && fallback.length > 0) {
          setSelectedTemplate(fallback[0]);
        }
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
  const fieldEnabled = (key) => !disabledFields.includes(key);
  const optionalValue = (key, fallback = undefined) => (
    fieldEnabled(key) && form[key] ? form[key] : fallback
  );

  // Step 2 → Step 3: just validate and move to review (no order created yet)
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const customerEmail = normalizeEmail(form.customerEmail);
    if (!isValidEmail(customerEmail)) {
      setError('Please enter a valid email address for your invitation code.');
      return;
    }
    setForm(prev => ({ ...prev, customerEmail }));
    if (form.weddingDate && form.weddingDate < todayISO) {
      setError('Please choose a wedding date that is today or in the future.');
      return;
    }
    if (music.uploading) {
      setError('Your music is still uploading. Please wait a moment before reviewing your order.');
      return;
    }
    setStep(3);
  };

  // Capture the order on the server after the buyer approves it in PayPal.
  const captureAndFinish = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/capture/${paypalOrderData.orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // PayPal orders are single-use. If capture failed because the order
        // expired or was never approved, the user must create a fresh one.
        if (data.paypalOrderExpired || res.status === 402) {
          setNeedsRetry(true);
        }
        throw new Error(data.error || 'Payment capture failed');
      }
      goToSuccessPage(paypalOrderData.orderId);
    } catch (captureErr) {
      setError(captureErr.message || 'Could not finalise payment');
    }
  }, [paypalOrderData, goToSuccessPage]);

  // Load the PayPal SDK once an order exists. The UI uses PayPal Buttons only
  // because the standard approval flow is the most reliable sandbox path.
  useEffect(() => {
    if (!paypalOrderData) return;
    let cancelled = false;

    (async () => {
      try {
        const paypal = await getPaypal({
          clientId: paypalOrderData.paypal.clientId,
          currency: paypalOrderData.paypal.currency || 'USD',
        });
        if (cancelled) return;
        setPaypalSdk(paypal);
      } catch (err) {
        if (!cancelled) {
          console.error('[paypal] init', err);
          setError(err.message || 'Could not load payment form');
          setPaypalLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [paypalOrderData]);

  // Render the PayPal Buttons after React has mounted the target container.
  useEffect(() => {
    if (!paypalSdk || !paypalOrderData || needsRetry) return;
    const target = paypalButtonRef.current;
    if (!target) return;
    let cancelled = false;
    let buttonsInstance = null;

    (async () => {
      try {
        buttonsInstance = paypalSdk.Buttons({
          createOrder: () => paypalOrderData.paypal.paypalOrderId,
          onApprove: () => captureAndFinish(),
          onError: (err) => {
            if (!cancelled) {
              console.error('[paypal] buttons error', err);
              setError(err?.message || 'PayPal reported an error. Please try again.');
            }
          },
          style: { layout: 'vertical', shape: 'rect', label: 'paypal' },
        });

        if (!buttonsInstance.isEligible()) {
          console.warn('[paypal] Buttons reported ineligible');
          if (!cancelled) {
            setError('PayPal payments are not available in this browser. Please try a different browser, or contact support.');
            setPaypalLoading(false);
          }
          return;
        }

        target.innerHTML = '';
        await buttonsInstance.render(target);
        if (!cancelled) setPaypalLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error('[paypal] buttons render', err);
          setPaypalLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try { buttonsInstance?.close?.(); } catch { /* unmounted */ }
    };
  }, [paypalSdk, paypalOrderData, needsRetry, captureAndFinish]);

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
    const customerEmail = normalizeEmail(form.customerEmail);

    if (!isValidEmail(customerEmail)) {
      setError('Please go back and enter a valid email address before payment.');
      setConfirming(false);
      return;
    }

    try {
      // Create the order now
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail,
          customerPhone: form.customerPhone,
          templateId: selectedTemplate._id,
          weddingDetails: {
            groomName: form.groomName,
            brideName: form.brideName,
            weddingDate: form.weddingDate || undefined,
            weddingTime: optionalValue('weddingTime'),
            venue: form.venue,
            venueAddress: optionalValue('venueAddress'),
            venueMapUrl: optionalValue('venueMapUrl'),
            message: fieldEnabled('message') ? (form.message.trim() || undefined) : undefined,
            language: form.language,
            secondLanguage: optionalValue('secondLanguage'),
          },
          disabledFields,
          photos: allPhotos.filter(p => !p._uploading && !p._failed),
          musicUrl: music.enabled && music.url && !music.uploading && !music.failed ? music.url : undefined,
          musicPublicId: music.enabled && music.publicId && !music.uploading && !music.failed ? music.publicId : undefined,
          musicEnabled: Boolean(music.enabled && music.url && !music.uploading && !music.failed),
          storyMilestones: storyMilestones.filter(m => m.title || m.date || m.description),
        }),
      });

      const data = await parseJsonOrThrow(res, 'Order creation');
      if (!res.ok) throw new Error(data.error || 'Order failed');

      if (data.paymentProvider === 'paypal' && data.paypal?.clientId && data.paypal?.paypalOrderId) {
        // Trigger inline PayPal Buttons render once the target frame is mounted.
        savePendingOrder(data.orderId);
        setPaypalOrderData({ orderId: data.orderId, paypal: data.paypal });
        setPaypalLoading(true);
        setConfirming(false);
        return;
      }

      // The server is supposed to return paymentProvider: 'paypal' with a
      // PayPal order id. Anything else means PayPal credentials are missing
      // on the server — never silently mark the order paid.
      throw new Error(
        'Payment system is not ready. Please refresh and try again, or contact support if the issue persists.'
      );
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  const optionalFields = [
    { key: 'venueAddress', label: 'Venue Address' },
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
                    <input type="email" required value={form.customerEmail} onChange={e => handleInput('customerEmail', e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    <p className="form-hint message-hint">Your invitation link and private code will be sent here.</p>
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

              {/* Wedding details — required */}
              <fieldset className="form-section">
                <legend>Wedding Details</legend>
                <div className="form-grid">
                  <div className="form-field">
                    <div className="field-header">
                      <label>Wedding Date *</label>
                    </div>
                    <input type="date" required min={todayISO} value={form.weddingDate} onChange={e => handleInput('weddingDate', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Wedding Time *</label>
                    <input type="time" required value={form.weddingTime} onChange={e => handleInput('weddingTime', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Venue Name *</label>
                    <input type="text" required value={form.venue} onChange={e => handleInput('venue', e.target.value)} placeholder="e.g. The Grand Pavilion" />
                  </div>
                  <div className="form-field">
                    <div className="field-header">
                      <label>Google Maps Link {!disabledFields.includes('venueMapUrl') && '*'}</label>
                      <button type="button" className="field-toggle" onClick={() => toggleField('venueMapUrl')}>
                        {disabledFields.includes('venueMapUrl') ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                    {!disabledFields.includes('venueMapUrl') ? (
                      <>
                        <input
                          type="url"
                          required
                          value={form.venueMapUrl}
                          onChange={e => handleInput('venueMapUrl', e.target.value)}
                          placeholder="https://maps.google.com/..."
                        />
                        <p className="form-hint message-hint">Paste a Google Maps share link so guests can navigate.</p>
                      </>
                    ) : (
                      <p className="form-hint message-hint form-hint-disabled">The map will be hidden from your invitation.</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Optional personalizations — clearly separated so users know what's not required */}
              <fieldset className="form-section form-section--optional">
                <legend>Optional Personalizations</legend>
                <p className="form-hint">All fields below are optional. Toggle off any you don't need — they won't appear on your invitation.</p>
                <div className="form-grid">
                  {optionalFields.map(field => (
                    <div key={field.key} className={`form-field ${['message', 'rsvp'].includes(field.key) ? 'form-field--wide' : ''} ${disabledFields.includes(field.key) ? 'field-disabled' : ''}`}>
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
                          <>
                            <textarea
                              className="message-textarea"
                              value={form[field.key]}
                              onChange={e => handleInput(field.key, e.target.value)}
                              rows={3}
                              placeholder={DEFAULT_INVITATION_MESSAGE}
                            />
                            <p className="form-hint message-hint">
                              Leave blank to use the template message shown in the demo.
                            </p>
                          </>
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
            {!paypalOrderData && (
              <button className="step-back-btn" onClick={() => setStep(2)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back to Details
              </button>
            )}

            <h1 className="step-title">{paypalOrderData ? 'Complete Your Order' : 'Review & Confirm'}</h1>
            <p className="step-subtitle">{paypalOrderData ? 'You\'re one step away from your invitation.' : 'Please review your order details before confirming payment'}</p>

            {!paypalOrderData && (
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

              {music.url && !music.uploading && !music.failed && music.enabled && (
                <div className="review-section">
                  <h3 className="review-section-title">Background Music</h3>
                  <div className="review-music">
                    <span>{music.name || 'Uploaded music'}</span>
                    <audio src={music.url} controls preload="metadata" />
                  </div>
                </div>
              )}
            </div>
            )}

            {!paypalOrderData && (
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

            {paypalOrderData && (
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
                  <button type="button" className="payment-summary-edit" onClick={() => { setPaypalOrderData(null); setPaypalLoading(false); }}>
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

                  <div className="card-pay-wrap">
                    {paypalLoading && (
                      <div className="card-pay-loading">
                        <div className="redirect-spinner" />
                        <p>Preparing secure checkout…</p>
                      </div>
                    )}

                    {needsRetry && !paypalLoading && (
                      <div className="card-pay-retry">
                        <p className="card-pay-retry-text">
                          That payment session ended without completing. Start a fresh secure checkout to try again.
                        </p>
                        <button
                          type="button"
                          className="btn btn-gold card-pay-retry-btn"
                          onClick={() => {
                            setNeedsRetry(false);
                            setError('');
                            setPaypalOrderData(null);
                            setPaypalLoading(false);
                            handleConfirmPayment();
                          }}
                        >
                          Start a new payment
                        </button>
                      </div>
                    )}

                    {!needsRetry && (
                      <div className="card-pay-fallback">
                        <h4 className="card-pay-fallback-title">Pay with PayPal</h4>
                        <p className="card-pay-fallback-text">
                          Choose PayPal or a card to complete your secure checkout.
                        </p>
                        <div
                          ref={paypalButtonRef}
                          className={`paypal-fallback-button ${paypalLoading ? 'paypal-fallback-button--loading' : ''}`}
                        />
                      </div>
                    )}
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
