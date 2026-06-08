import { useState, useEffect, useRef, useCallback, Suspense, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { getPaypal } from '../lib/paypal';
import InvitationPhoto from '../invitations/InvitationPhoto';
import InvitationPreviewFrame from '../components/InvitationPreviewFrame';
import { DEFAULT_PLUS_ONE_POLICY_TEXT } from '../invitations/shared';
import { getUploadPreviewStyle } from '../invitations/uploadPreviewStyles';
import registry from '../invitations/registry';
import { DEFAULT_INVITATION_FONT, INVITATION_FONT_OPTIONS, getInvitationFontOption, normalizeInvitationFont } from '../invitations/fontOptions';
import { DEFAULT_PRICING_TIER, PRICING_TIERS, getPricingTier, normalizePricingTier, tierAllows, getTierDisabledFields } from '../lib/pricingTiers';
import { migrateGuestPolicyFields } from '../lib/guestPolicyFields';
import coastalSplashPreview from '../assets/coastal/thumbnail.png';
import fountainHero1Preview from '../assets/Fountain Reverie/thumbnail3.png';
import fountainHero2Preview from '../assets/Fountain Reverie/thumbnail4.png';
import boardingPassPreview from '../assets/boardingPass/thumbnail.png';
import GardenPavilionPreview from '../assets/gardenPavilion/thumbnail.png';
import theaterPreview from '../assets/theater/Thumbnail.png';
import '../styles/OrderFlow.css';

const API = import.meta.env.VITE_API_URL || '/api';
const STORAGE_KEY = 'veloura_order_draft';
const PENDING_ORDER_KEY = 'veloura_pending_order_id';
const OLD_MESSAGE_HELP_TEXT = 'This text appears as the tagline under your names in the invitation ';
// The envelope "A Note" message every design reveals in its demo. Used as the
// placeholder for the optional Envelope Message field.
const DEFAULT_ENVELOPE_MESSAGE = 'Thank you for being part of the moments that brought us here. We feel incredibly lucky to celebrate this beginning with the people we love most.';

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const formatOrderTime = (value = '', preference = '12h') => {
  const raw = `${value || ''}`.trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  if (preference === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
};

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

function getPricingQuery() {
  const params = new URLSearchParams();
  const region = getPricingRegion();
  if (!region.timezone && !region.locale) return '';
  params.set('timezone', region.timezone);
  params.set('locale', region.locale);
  return params.toString();
}

function getPricingRegion() {
  try {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      locale: navigator.language || '',
    };
  } catch {
    return { timezone: '', locale: '' };
  }
}

const PHOTO_CATEGORIES = [
  { key: 'venue', label: 'Venue Photos', hint: 'Photos of your venue or ceremony location (max 2)', icon: 'location', max: 2 },
  { key: 'story', label: 'Our Story Photos', hint: 'Photos from your journey together — first date, trips, proposal (max 4)', icon: 'book', max: 4 },
  { key: 'gallery', label: 'Gallery Photos', hint: 'Additional photos for the gallery section (max 6)', icon: 'grid', max: 6 },
];

// Local fallback images keyed by slug — used when API images fail to load
const DEFAULT_PHOTO_FIT = 'cover';
const VALID_PHOTO_FITS = new Set(['cover', 'contain']);
const PHOTO_FIT_OPTIONS = [
  { value: 'cover', label: 'Fill', hint: 'Fill the frame' },
  { value: 'contain', label: 'Contain', hint: 'Keep most of the photo visible' },
];

const GUEST_POLICY_OPTIONS = {
  children: [
    { value: 'welcome', label: 'Children welcome', text: 'Little ones are warmly welcome to share in the celebration.' },
    { value: 'adults-only', label: 'Adults only', text: 'With love, we kindly request an adults-only celebration.' },
  ],
  plusOne: [
    { value: 'welcome', label: 'Guests may bring someone', text: 'You are warmly welcome to bring a guest with you.' },
    { value: 'named-only', label: 'No plus-one', text: DEFAULT_PLUS_ONE_POLICY_TEXT },
  ],
};

function getGuestPolicyText(weddingDetails = {}) {
  const children = weddingDetails.childrenPolicyText?.trim()
    || GUEST_POLICY_OPTIONS.children.find(option => option.value === weddingDetails.childrenPolicy)?.text;
  const plusOne = weddingDetails.plusOnePolicyText?.trim()
    || GUEST_POLICY_OPTIONS.plusOne.find(option => option.value === weddingDetails.plusOnePolicy)?.text;
  return [children, plusOne].filter(Boolean).join(' ');
}

// Which optional fields each invitation design actually renders. Fields that
// a template does not display are hidden from the order form so the user is
// never asked for details that won't appear on their invitation.
// (Unknown/remote templates default to showing every optional field.)
const TEMPLATE_OPTIONAL_FIELD_SUPPORT = {
  'boarding-pass': { message: true, coupleMessage: true },
  'coastal-breeze': { message: true, coupleMessage: true },
  'fountain-reverie-v1': { message: true, coupleMessage: true },
  'fountain-reverie-v2': { message: true, coupleMessage: true },
  'gazebo-garden': { message: true, coupleMessage: true },
  'theater': { message: false, coupleMessage: true },
};

const TEMPLATE_DEMO_PERSONAL_MESSAGE = {
  'boarding-pass': 'Two Souls, One Destination.',
  'coastal-breeze': 'With the sea as our witness, we begin forever.',
  'fountain-reverie-v1': 'Thank you for being part of the moments that brought us here. We feel incredibly lucky to celebrate this beginning with the people we love most.',
  'fountain-reverie-v2': 'Thank you for being part of the moments that brought us here. We feel incredibly lucky to celebrate this beginning with the people we love most.',
  'gazebo-garden': 'A garden promise sealed in soft light.',
  'theater': 'Black tie - Dinner & dancing to follow',
};

// The envelope "A Note" message each design shows in its demo. Surfaced as the
// placeholder for the optional Envelope Message field so users see the real
// demo copy for the design they picked.
const TEMPLATE_DEMO_ENVELOPE_MESSAGE = {
  'boarding-pass': DEFAULT_ENVELOPE_MESSAGE,
  'coastal-breeze': DEFAULT_ENVELOPE_MESSAGE,
  'fountain-reverie-v1': DEFAULT_ENVELOPE_MESSAGE,
  'fountain-reverie-v2': DEFAULT_ENVELOPE_MESSAGE,
  'gazebo-garden': DEFAULT_ENVELOPE_MESSAGE,
  'theater': DEFAULT_ENVELOPE_MESSAGE,
};

const normalizePhotoFit = (value) => {
  if (value === 'fit' || value === 'containFit' || value === 'contain') return 'contain';
  return VALID_PHOTO_FITS.has(value) ? value : DEFAULT_PHOTO_FIT;
};
const TEMPLATE_PREVIEW_IMAGES = {
  'coastal-breeze': coastalSplashPreview,
  'fountain-reverie-v1': fountainHero1Preview,
  'fountain-reverie-v2': fountainHero2Preview,
  'gazebo-garden': GardenPavilionPreview,
  'boarding-pass': boardingPassPreview,
  'theater': theaterPreview,
};

// Designs temporarily hidden from the order flow's design picker. The server's
// /api/templates response still includes these, so we filter them out of the
// merged list as well — not just the local fallback definitions above.
const HIDDEN_TEMPLATE_SLUGS = new Set(['fountain-reverie-v1', 'fountain-reverie-v2', 'theater']);

// Slugs that render with the home Designs.jsx overlay+text treatment instead of
// a plain preview image, so the card matches the home collection exactly.
const TEMPLATE_PREVIEW_CARDS = {
  'coastal-breeze': {
    overlay: 'linear-gradient(135deg, rgba(31,95,143,0.16), rgba(236,134,111,0.12))',
    // previewText: 'Coastal Breeze',
  },
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
  // A `tier` query param means the buyer just chose a plan on the home/pricing
  // page — that explicit choice must win over any saved draft tier and land
  // them on step 1 so they can see the plan they picked already selected.
  const urlTierParam = new URLSearchParams(window.location.search).get('tier');
  const hasUrlTier = Boolean(urlTierParam && normalizePricingTier(urlTierParam) === urlTierParam);
  const initialTier = normalizePricingTier(
    urlTierParam || draft?.selectedTier || DEFAULT_PRICING_TIER
  );

  const [step, setStep] = useState(hasUrlTier ? 1 : (draft?.step || 1));
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(draft?.selectedTemplate || null);
  const [loading, setLoading] = useState(true);
  const [pricingCatalog, setPricingCatalog] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [paypalOrderData, setPaypalOrderData] = useState(null);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);
  const [cardFieldsEligible, setCardFieldsEligible] = useState(false);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardError, setCardError] = useState('');
  const [needsRetry, setNeedsRetry] = useState(false);
  const [paypalSdk, setPaypalSdk] = useState(null);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [policyPickerOpen, setPolicyPickerOpen] = useState(null);
  const paypalButtonRef = useRef(null);
  const cardNameRef = useRef(null);
  const cardNumberRef = useRef(null);
  const cardExpiryRef = useRef(null);
  const cardCvvRef = useRef(null);
  const cardFieldsRef = useRef(null);
  // Guards against a second capture call while one is already in flight or done,
  // so a buyer who triggers approval twice is never charged/captured twice.
  const captureInFlightRef = useRef(false);
  const orderCreationInFlightRef = useRef(false);

  // Form state — restore from draft
  const defaultForm = {
    customerName: '',
    customerEmail: '',
    groomName: '',
    brideName: '',
    weddingDate: '',
    weddingTime: '',
    timeFormat: '12h',
    venue: '',
    venueMapUrl: '',
    message: '',
    coupleMessage: '',
    childrenPolicy: 'welcome',
    plusOnePolicy: 'named-only',
    childrenPolicyText: GUEST_POLICY_OPTIONS.children[0].text,
    plusOnePolicyText: GUEST_POLICY_OPTIONS.plusOne[1].text,
    askPlusOne: false,
    invitationFont: DEFAULT_INVITATION_FONT,
    language: 'en',
    secondLanguage: '',
  };
  const [form, setForm] = useState(() => {
    const restored = draft?.form || defaultForm;
    return {
      ...defaultForm,
      ...restored,
      invitationFont: normalizeInvitationFont(restored.invitationFont),
      message: restored.message === OLD_MESSAGE_HELP_TEXT ? '' : (restored.message || ''),
      coupleMessage: restored.coupleMessage || '',
    };
  });
  const messageTouchedRef = useRef(Boolean(draft?.form?.message && draft.form.message !== OLD_MESSAGE_HELP_TEXT));
  const coupleMessageTouchedRef = useRef(Boolean(draft?.form?.coupleMessage));

  const [disabledFields, setDisabledFields] = useState(migrateGuestPolicyFields(draft?.disabledFields || []));
  // Photos organized by category — restore uploaded photos from draft
  // Mark any _pendingUpload photos as failed (upload was lost on reload, user must re-add)
  const initPhotos = (() => {
    const raw = draft?.photos || { venue: [], story: [], gallery: [] };
    const result = {};
    for (const cat of Object.keys(raw)) {
      result[cat] = (raw[cat] || []).map((p) => {
        const fit = normalizePhotoFit(p.fit);
        return p._pendingUpload ? { ...p, fit, _failed: true, _pendingUpload: false } : { ...p, fit };
      });
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
    // Debounce the draft write: serialising the whole draft (including photo
    // thumbnails) to localStorage is heavy, so doing it synchronously on every
    // keystroke/selection makes typing and step changes feel laggy. A short
    // delay coalesces rapid updates into a single write once the user pauses.
    const handle = setTimeout(() => {
      const persistablePhotos = {};
      for (const cat of Object.keys(photos)) {
        persistablePhotos[cat] = photos[cat]
          .map(p => {
            // Uploaded to Cloudinary — save the real URL
            if (p.publicId && !p._uploading) {
              return { url: p.url, publicId: p.publicId, label: p.label, fit: normalizePhotoFit(p.fit) };
            }
            // Still uploading or failed — save the thumbnail for reload survival
            if (p._thumbUrl) {
              return { url: p._thumbUrl, publicId: '', label: p.label, fit: normalizePhotoFit(p.fit), _pendingUpload: true };
            }
            // No thumbnail available (e.g. HEIC couldn't render) — skip
            return null;
          })
          .filter(Boolean);
      }
      saveDraft({
        step,
        selectedTier,
        selectedTemplate,
        form,
        disabledFields,
        photos: persistablePhotos,
        storyMilestones,
        music,
      });
    }, 350);
    return () => clearTimeout(handle);
  }, [step, selectedTier, selectedTemplate, form, disabledFields, photos, storyMilestones, music]);

  // Local template definitions used as fallback when API is unavailable
  const localTemplates = [
    { _id: 'boarding-pass', name: 'Boarding Pass', slug: 'boarding-pass', category: 'launch', envelope: 'Airmail envelope with vintage stamps slides open', colorScheme: { primary: '#42a5f5', secondary: '#0d47a1', background: '#e3f2fd' } },
    { _id: 'gazebo-garden', name: 'Garden Pavilion', slug: 'gazebo-garden', category: 'launch', envelope: 'Animated envelope opens into a watercolor garden gazebo with a bird in flight', colorScheme: { primary: '#86ad61', secondary: '#fff8ea', background: '#eff8dc' } },
    { _id: 'coastal-breeze', name: 'Coastal Breeze', slug: 'coastal-breeze', category: 'launch', envelope: 'Blue envelope opens to a bride and groom walking toward the sea', colorScheme: { primary: '#1f5f8f', secondary: '#ec866f', background: '#fffaf1' } },
    // Temporarily hidden designs (also filtered out of the merged API list via HIDDEN_TEMPLATE_SLUGS):
    // { _id: 'fountain-reverie-v1', name: 'Fountain Reverie I', slug: 'fountain-reverie-v1', category: 'launch', envelope: 'Ornate garden doors open to a sunlit fountain invitation', colorScheme: { primary: '#94742f', secondary: '#f5dfcf', background: '#fff6e8' } },
    // { _id: 'fountain-reverie-v2', name: 'Fountain Reverie II', slug: 'fountain-reverie-v2', category: 'launch', envelope: 'Ornate garden doors open to a wide floral fountain invitation', colorScheme: { primary: '#94742f', secondary: '#87916c', background: '#fff6e8' } },
    // { _id: 'theater', name: 'Theater', slug: 'theater', category: 'launch', envelope: 'Velvet curtain parts to reveal a softly lit stage', colorScheme: { primary: '#6e0f1f', secondary: '#c9a45a', background: '#fff5e1' } },
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
    const fallback = localTemplates
      .filter(t => t.category === 'launch' && !HIDDEN_TEMPLATE_SLUGS.has(t.slug))
      .map(t => ({
        ...t,
        previewImage: TEMPLATE_PREVIEW_IMAGES[t.slug] || '',
      }));
    setTemplates(fallback);
    setSelectedTemplate(prev => {
      if (!prev) return fallback[0] || null;
      const match = fallback.find(t => t.slug === prev.slug);
      return match ? { ...prev, ...match } : prev;
    });
    setLoading(false);

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
          .filter(t => t.category === 'launch' && !HIDDEN_TEMPLATE_SLUGS.has(t.slug))
          .map(t => ({
            ...t,
            previewImage: TEMPLATE_PREVIEW_IMAGES[t.slug] || t.previewImage || '',
          }));
        setTemplates(merged);
        setSelectedTemplate(prev => {
          if (!prev) return merged[0] || null;
          const match = merged.find(t => t.slug === prev.slug);
          return match ? { ...prev, ...match } : (merged[0] || null);
        });
      })
      .catch(() => {
        // Local templates are already visible; keep the order flow responsive.
      });
  }, []);

  useEffect(() => {
    const query = getPricingQuery();
    fetch(`${API}/pricing${query ? `?${query}` : ''}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.tiers?.length) setPricingCatalog(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTemplate?.slug) return;

    const personalMessage = TEMPLATE_DEMO_PERSONAL_MESSAGE[selectedTemplate.slug] || '';
    const envelopeMessage = TEMPLATE_DEMO_ENVELOPE_MESSAGE[selectedTemplate.slug] || DEFAULT_ENVELOPE_MESSAGE;

    setForm(prev => {
      const next = { ...prev };
      if (!messageTouchedRef.current && !next.message && personalMessage) {
        next.message = personalMessage;
      }
      if (!coupleMessageTouchedRef.current && !next.coupleMessage && envelopeMessage) {
        next.coupleMessage = envelopeMessage;
      }
      return next;
    });
  }, [selectedTemplate?.slug]);

  const handleInput = (key, value) => {
    if (key === 'message') messageTouchedRef.current = true;
    if (key === 'coupleMessage') coupleMessageTouchedRef.current = true;
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const applyGuestPolicyPreset = (group, option) => {
    const textKey = group === 'children' ? 'childrenPolicyText' : 'plusOnePolicyText';
    const valueKey = group === 'children' ? 'childrenPolicy' : 'plusOnePolicy';
    setForm(prev => ({ ...prev, [valueKey]: option.value, [textKey]: option.text }));
    setPolicyPickerOpen(null);
  };

  const toggleField = (key) => {
    setDisabledFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  // Enable/disable the whole Guest Guidance section at once (both notes).
  const toggleGuestGuidance = () => {
    setDisabledFields(prev => {
      const bothOff = prev.includes('childrenNote') && prev.includes('plusOneNote');
      return bothOff
        ? prev.filter(f => f !== 'childrenNote' && f !== 'plusOneNote')
        : [...new Set([...prev, 'childrenNote', 'plusOneNote'])];
    });
  };

  // Fallback for images the browser can't render natively (e.g. HEIC)
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
              ? { url: data.files[0].url, publicId: data.files[0].publicId, label: category, fit: normalizePhotoFit(p.fit) }
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
        fit: DEFAULT_PHOTO_FIT,
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

  const setPhotoFit = (category, index, fit) => {
    const nextFit = normalizePhotoFit(fit);
    setPhotos(prev => ({
      ...prev,
      [category]: prev[category].map((photo, i) => (
        i === index && photo ? { ...photo, fit: nextFit } : photo
      )),
    }));
  };

  const storyPreviewStyle = getUploadPreviewStyle(selectedTemplate?.slug, 'story');
  const galleryPreviewStyle = getUploadPreviewStyle(selectedTemplate?.slug, 'gallery');
  const pricingTiers = pricingCatalog?.tiers?.length
    ? PRICING_TIERS.map(tier => ({
      ...tier,
      ...(pricingCatalog.tiers.find(remoteTier => remoteTier.id === tier.id) || {}),
    }))
    : PRICING_TIERS;
  const selectedTierConfig = pricingTiers.find(tier => tier.id === normalizePricingTier(selectedTier)) || getPricingTier(selectedTier);
  const displayPrice = selectedTierConfig.displayPrice || selectedTierConfig.price;
  const paymentDisplayPrice = paypalOrderData?.pricing?.displayPrice || displayPrice;
  const effectiveDisabledFields = [...new Set([...disabledFields, ...getTierDisabledFields(selectedTier)])];
  const storyIncluded = tierAllows(selectedTier, 'story');
  const galleryIncluded = tierAllows(selectedTier, 'gallery');
  const rsvpIncluded = tierAllows(selectedTier, 'rsvp');
  const coupleMessageIncluded = tierAllows(selectedTier, 'coupleMessage');
  const musicIncluded = tierAllows(selectedTier, 'music');
  const photoAllowedForTier = (photo) => {
    if (photo.label === 'story') return storyIncluded;
    if (photo.label === 'gallery') return galleryIncluded;
    return true;
  };

  // Flatten all photos for submission & review (exclude failed/uploading)
  const allPhotos = Object.entries(photos).flatMap(([cat, items]) =>
    items
      .filter(p => !p._uploading && !p._failed && !p._pendingUpload)
      .map(p => ({ ...p, label: p.label || cat }))
  );
  const tieredPhotos = allPhotos.filter(photoAllowedForTier);
  const cleanedStoryMilestones = storyIncluded
    ? storyMilestones.filter(m => m.title || m.date || m.description)
    : [];
  const fieldEnabled = (key) => !effectiveDisabledFields.includes(key);
  const optionalValue = (key, fallback = undefined) => (
    fieldEnabled(key) && form[key] ? form[key] : fallback
  );
  const previewOrder = {
    template: selectedTemplate,
    preview: true,
    pricingTier: selectedTier,
    weddingDetails: {
      groomName: form.groomName,
      brideName: form.brideName,
      weddingDate: form.weddingDate || undefined,
      weddingTime: optionalValue('weddingTime'),
      timeFormat: form.timeFormat || '12h',
      venue: form.venue,
      venueMapUrl: optionalValue('venueMapUrl'),
      message: fieldEnabled('message') ? form.message.trim() : undefined,
      childrenPolicy: form.childrenPolicy,
      plusOnePolicy: form.plusOnePolicy,
      childrenPolicyText: form.childrenPolicyText?.trim(),
      plusOnePolicyText: form.plusOnePolicyText?.trim(),
      askPlusOne: form.askPlusOne,
      language: form.language,
      secondLanguage: optionalValue('secondLanguage'),
    },
    coupleMessage: fieldEnabled('coupleMessage') ? form.coupleMessage.trim() : undefined,
    disabledFields: effectiveDisabledFields,
    photos: tieredPhotos,
    customizations: {
      invitationFont: normalizeInvitationFont(form.invitationFont),
    },
    musicEnabled: false,
    storyMilestones: cleanedStoryMilestones,
  };
  const previewRegistryEntry = selectedTemplate ? registry[selectedTemplate.slug] : null;
  const PreviewInvitationComponent = previewRegistryEntry?.component;
  const selectedFontOption = getInvitationFontOption(form.invitationFont);
  // Tracks how many forward steps we've pushed onto history since mount so the
  // in-page back buttons can pop (history.back) instead of pushing — keeping
  // the device/browser back button perfectly in sync with the visual steps.
  const stepDepthRef = useRef(0);
  const goToStep = useCallback((nextStep) => {
    setStep(nextStep);
    // Push a history entry per step so the device/browser back button walks
    // back through the order flow instead of leaving for the home page.
    stepDepthRef.current += 1;
    try {
      window.history.pushState({ orderStep: nextStep }, '');
    } catch { /* history unavailable */ }
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0 });
    });
  }, []);

  // In-page "back" controls: pop history so they behave identically to the
  // device back button. Falls back to a plain step change if there is no
  // earlier order entry to return to (e.g. a draft restored mid-flow).
  const goBack = useCallback((fallbackStep) => {
    if (stepDepthRef.current > 0) {
      window.history.back();
    } else {
      setStep(fallbackStep);
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    }
  }, []);

  // Keep the order step in sync with browser history. On mount we seed one
  // history entry per step up to the current one, so the device/browser back
  // button walks back through the earlier steps — even when the flow was
  // restored from a saved draft directly onto step 2/3/4 (e.g. on mobile, or
  // after a reload) rather than reached by clicking forward.
  useEffect(() => {
    const initialStep = step;
    try {
      window.history.replaceState({ orderStep: 1 }, '');
      for (let s = 2; s <= initialStep; s += 1) {
        window.history.pushState({ orderStep: s }, '');
      }
      stepDepthRef.current = Math.max(0, initialStep - 1);
    } catch { /* history unavailable */ }
    const onPopState = (event) => {
      const previousStep = event.state?.orderStep;
      if (previousStep) {
        stepDepthRef.current = Math.max(0, stepDepthRef.current - 1);
        setStep(previousStep);
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!previewOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewOpen]);

  useEffect(() => {
    if (paypalOrderData && previewOpen) setPreviewOpen(false);
  }, [paypalOrderData, previewOpen]);

  useEffect(() => {
    if (!fontPickerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFontPickerOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fontPickerOpen]);

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
    goToStep(4);
  };

  // Capture the order on the server after the buyer approves it in PayPal.
  const captureAndFinish = useCallback(async () => {
    if (captureInFlightRef.current) return;
    captureInFlightRef.current = true;
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
      // Allow a retry only on failure — a successful capture keeps the guard set
      // so the success navigation can't be undone by a stray second approval.
      captureInFlightRef.current = false;
      setCardSubmitting(false);
      setError(captureErr.message || 'Could not finalise payment');
    }
  }, [paypalOrderData, goToSuccessPage]);

  // Load the PayPal SDK once an order exists. We request both wallet buttons
  // and advanced card fields so the buyer can use the custom Veloura card form.
  useEffect(() => {
    if (!paypalOrderData) return;
    let cancelled = false;

    (async () => {
      try {
        const paypal = await getPaypal({
          clientId: paypalOrderData.paypal.clientId,
          currency: paypalOrderData.paypal.currency || 'USD',
          components: 'buttons,card-fields',
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

  // Render PayPal Advanced Card Fields into Veloura-styled containers.
  useEffect(() => {
    if (!paypalSdk || !paypalOrderData || needsRetry) return;
    const containers = [cardNameRef.current, cardNumberRef.current, cardExpiryRef.current, cardCvvRef.current];
    if (containers.some(container => !container)) return;
    let cancelled = false;
    const renderedFields = [];

    (async () => {
      try {
        if (!paypalSdk.CardFields) {
          setCardFieldsEligible(false);
          setCardFieldsReady(false);
          return;
        }

        const cardFields = paypalSdk.CardFields({
          createOrder: () => paypalOrderData.paypal.paypalOrderId,
          onApprove: () => captureAndFinish(),
          onError: (err) => {
            if (!cancelled) {
              console.error('[paypal] card fields error', err);
              setCardSubmitting(false);
              setError(err?.message || 'Card payment could not be completed. Please try again.');
            }
          },
          inputEvents: {
            onChange: () => {
              if (!cancelled) {
                setError('');
                setCardError('');
              }
            },
          },
          style: {
            input: {
              color: '#342d25',
              background: 'transparent',
              border: '0',
              'border-radius': '0',
              'box-shadow': 'none',
              height: '40px',
              'font-size': '16px',
              'font-weight': '500',
              'font-family': 'Inter, system-ui, sans-serif',
              'line-height': '40px',
              padding: '0',
              transition: 'background-color 100000s ease-in-out 0s',
            },
            'input:-webkit-autofill': {
              transition: 'background-color 100000s ease-in-out 0s',
              '-webkit-text-fill-color': '#342d25',
            },
            '::placeholder': {
              color: '#9b8f80',
              'font-weight': '500',
              'font-size': '16px',
            },
            ':focus': {
              border: '0',
              color: '#231f1a',
              'box-shadow': 'none',
            },
            '.invalid': {
              border: '0',
              outline: '0',
              'box-shadow': 'none',
              background: 'transparent',
              color: '#c4727f',
            },
          },
        });

        if (!cardFields.isEligible()) {
          if (!cancelled) {
            setCardFieldsEligible(false);
            setCardFieldsReady(false);
          }
          return;
        }

        containers.forEach(container => { container.innerHTML = ''; });
        const nameField = cardFields.NameField({ placeholder: 'Full name' });
        const numberField = cardFields.NumberField({ placeholder: '1234 1234 1234 1234' });
        const expiryField = cardFields.ExpiryField({ placeholder: 'MM / YY' });
        const cvvField = cardFields.CVVField({ placeholder: '123' });
        renderedFields.push(nameField, numberField, expiryField, cvvField);

        await Promise.all([
          nameField.render(cardNameRef.current),
          numberField.render(cardNumberRef.current),
          expiryField.render(cardExpiryRef.current),
          cvvField.render(cardCvvRef.current),
        ]);

        if (!cancelled) {
          cardFieldsRef.current = cardFields;
          setCardFieldsEligible(true);
          setCardFieldsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[paypal] card fields render', err);
          setCardFieldsEligible(false);
          setCardFieldsReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cardFieldsRef.current = null;
      renderedFields.forEach(field => {
        try { field?.close?.(); } catch { /* unmounted */ }
      });
    };
  }, [paypalSdk, paypalOrderData, needsRetry, captureAndFinish]);

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

  const handleCardPayment = useCallback(async () => {
    if (!cardFieldsRef.current || cardSubmitting || !cardFieldsReady) return;
    setCardSubmitting(true);
    setError('');
    setCardError('');
    try {
      await cardFieldsRef.current.submit();
    } catch (err) {
      setCardSubmitting(false);
      setCardError(err?.message || 'Please check your card details and try again.');
    }
  }, [cardSubmitting, cardFieldsReady]);

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
    if (orderCreationInFlightRef.current || confirming || paypalLoading || paypalOrderData) return;
    orderCreationInFlightRef.current = true;
    setConfirming(true);
    setError('');
    const customerEmail = normalizeEmail(form.customerEmail);

    if (!isValidEmail(customerEmail)) {
      setError('Please go back and enter a valid email address before payment.');
      orderCreationInFlightRef.current = false;
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
          templateId: selectedTemplate._id,
          pricingTier: selectedTier,
          pricingRegion: getPricingRegion(),
          weddingDetails: {
            groomName: form.groomName,
            brideName: form.brideName,
            weddingDate: form.weddingDate || undefined,
            weddingTime: optionalValue('weddingTime'),
            timeFormat: form.timeFormat || '12h',
            venue: form.venue,
            venueMapUrl: optionalValue('venueMapUrl'),
            message: fieldEnabled('message') ? form.message.trim() : undefined,
            childrenPolicy: form.childrenPolicy,
            plusOnePolicy: form.plusOnePolicy,
            childrenPolicyText: form.childrenPolicyText?.trim(),
            plusOnePolicyText: form.plusOnePolicyText?.trim(),
            askPlusOne: form.askPlusOne,
            language: form.language,
            secondLanguage: optionalValue('secondLanguage'),
          },
          coupleMessage: fieldEnabled('coupleMessage') ? form.coupleMessage.trim() : undefined,
          customizations: {
            invitationFont: normalizeInvitationFont(form.invitationFont),
          },
          disabledFields: effectiveDisabledFields,
          photos: tieredPhotos.filter(p => !p._uploading && !p._failed),
          musicUrl: musicIncluded && music.enabled && music.url && !music.uploading && !music.failed ? music.url : undefined,
          musicPublicId: musicIncluded && music.enabled && music.publicId && !music.uploading && !music.failed ? music.publicId : undefined,
          musicEnabled: Boolean(musicIncluded && music.enabled && music.url && !music.uploading && !music.failed),
          storyMilestones: cleanedStoryMilestones,
        }),
      });

      const data = await parseJsonOrThrow(res, 'Order creation');
      if (!res.ok) throw new Error(data.error || 'Order failed');

      if (data.paymentProvider === 'paypal' && data.paypal?.clientId && data.paypal?.paypalOrderId) {
        // Trigger inline PayPal Buttons render once the target frame is mounted.
        savePendingOrder(data.orderId);
        setPaypalOrderData({ orderId: data.orderId, paypal: data.paypal, pricing: data.pricing });
        setPaypalLoading(true);
        setCardFieldsReady(false);
        setCardFieldsEligible(false);
        setCardSubmitting(false);
        orderCreationInFlightRef.current = false;
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
      orderCreationInFlightRef.current = false;
      setConfirming(false);
    }
  };

  // Only offer optional fields that the chosen invitation design actually shows.
  // Unknown templates fall back to showing the field.
  const templateFieldSupport = TEMPLATE_OPTIONAL_FIELD_SUPPORT[selectedTemplate?.slug] || {};
  const optionalFields = [
    // { key: 'message', label: 'Personal Message' },
    { key: 'coupleMessage', label: 'Envelope Message' },
    { key: 'rsvp', label: 'RSVP Section' },
    // Removed secondLanguage option
  ].filter(field => {
    if (field.key === 'message') return templateFieldSupport.message !== false;
    if (field.key === 'coupleMessage') return coupleMessageIncluded && templateFieldSupport.coupleMessage !== false;
    if (field.key === 'rsvp') return rsvpIncluded;
    return true;
  });

  // Guest guidance — polite notes telling guests who's invited. Lives inside the
  // RSVP section (below the RSVP toggle) since it speaks to the same audience.
  const guestGuidanceFields = (
    <div className="guest-policy-block">
      <div className="guest-policy-section-head">
        <p className="form-hint">Polite notes telling guests who's invited.</p>
        <button type="button" className="field-toggle" onClick={toggleGuestGuidance}>
          {disabledFields.includes('childrenNote') && disabledFields.includes('plusOneNote') ? 'Enable all' : 'Disable all'}
        </button>
      </div>
      {disabledFields.includes('childrenNote') && disabledFields.includes('plusOneNote') ? (
        <p className="form-hint message-hint form-hint-disabled">Hidden — guests won’t see any guest guidance notes.</p>
      ) : (
        <div className="guest-policy-card-grid">
          <article className={`guest-policy-card ${disabledFields.includes('childrenNote') ? 'guest-policy-card--off' : ''}`}>
            <div className="guest-policy-card-head">
              <span>Children</span>
              <button
                type="button"
                className={`guest-policy-card-toggle ${disabledFields.includes('childrenNote') ? 'is-off' : 'is-on'}`}
                role="switch"
                aria-checked={!disabledFields.includes('childrenNote')}
                onClick={() => toggleField('childrenNote')}
              >
                <span className="guest-policy-switch-track"><span className="guest-policy-switch-thumb" /></span>
                {disabledFields.includes('childrenNote') ? 'Off' : 'On'}
              </button>
            </div>
            {disabledFields.includes('childrenNote') ? (
              <p className="form-hint message-hint form-hint-disabled">Hidden — guests won’t see a note about children.</p>
            ) : (
              <>
                <button
                  type="button"
                  className="guest-policy-choose"
                  onClick={() => setPolicyPickerOpen('children')}
                >
                  Tap to choose suggested wording
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <textarea
                  rows={2}
                  value={form.childrenPolicyText}
                  onChange={e => handleInput('childrenPolicyText', e.target.value)}
                  placeholder="…or write your own note about children."
                />
              </>
            )}
          </article>
          <article className={`guest-policy-card ${disabledFields.includes('plusOneNote') ? 'guest-policy-card--off' : ''}`}>
            <div className="guest-policy-card-head">
              <span>Bringing a guest</span>
              <button
                type="button"
                className={`guest-policy-card-toggle ${disabledFields.includes('plusOneNote') ? 'is-off' : 'is-on'}`}
                role="switch"
                aria-checked={!disabledFields.includes('plusOneNote')}
                onClick={() => toggleField('plusOneNote')}
              >
                <span className="guest-policy-switch-track"><span className="guest-policy-switch-thumb" /></span>
                {disabledFields.includes('plusOneNote') ? 'Off' : 'On'}
              </button>
            </div>
            {disabledFields.includes('plusOneNote') ? (
              <p className="form-hint message-hint form-hint-disabled">Hidden — guests won’t see a note about bringing a guest.</p>
            ) : (
              <>
                <button
                  type="button"
                  className="guest-policy-choose"
                  onClick={() => setPolicyPickerOpen('plusOne')}
                >
                  Tap to choose suggested wording
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <textarea
                  rows={2}
                  value={form.plusOnePolicyText}
                  onChange={e => handleInput('plusOnePolicyText', e.target.value)}
                  placeholder="…or write your own note about bringing a guest."
                />
              </>
            )}
          </article>
        </div>
      )}
    </div>
  );

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
        <Link to="/" className="order-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </Link>

        {/* Progress bar */}
        <div className="order-progress" role="list" aria-label="Order progress">
          {['Choose Plan', 'Choose Design', 'Your Details', 'Payment'].map((label, index) => {
            const stepNumber = index + 1;
            const state = step > stepNumber ? 'completed' : step === stepNumber ? 'current' : 'upcoming';
            return (
              <Fragment key={label}>
                {index > 0 && <div className={`progress-line ${step > index ? 'filled' : ''}`} aria-hidden="true" />}
                <div className={`progress-step ${state}`} role="listitem" aria-current={state === 'current' ? 'step' : undefined}>
                  <div className="progress-dot">
                    {state === 'completed' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span>{label}</span>
                </div>
              </Fragment>
            );
          })}
        </div>

        {error && <div className="order-error">{error}</div>}

        {/* Step 1: Select pricing tier */}
        {step === 1 && (
          <div className="step-content">
            <h1 className="step-title">Choose Your Invitation Plan</h1>
            <p className="step-subtitle">Your plan controls which sections appear on your invitation.</p>

            <div className="tier-choice-grid">
              {pricingTiers.map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  className={`tier-choice-card ${selectedTier === tier.id ? 'selected' : ''} ${tier.featured ? 'featured' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                  aria-pressed={selectedTier === tier.id}
                >
                  <span className="tier-choice-check" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <span className="tier-choice-badge">{tier.badge}</span>
                  <span className="tier-choice-name">{tier.name}</span>
                  <span className="tier-choice-price">
                    <span>{tier.oldDisplayPrice || tier.oldPrice}</span>
                    {tier.displayPrice || tier.price}
                  </span>
                  <span className="tier-choice-desc">{tier.description}</span>
                  <span className="tier-choice-sections">
                    <span>Core details</span>
                    {tier.sections.countdown && <span>Countdown</span>}
                    {tier.sections.coupleMessage && <span>Envelope note</span>}
                    {tier.sections.story && <span>Our Story</span>}
                    {tier.sections.gallery && <span>Gallery</span>}
                    {tier.sections.rsvp && <span>RSVP</span>}
                  </span>
                </button>
              ))}
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn-gold step-next"
                onClick={() => goToStep(2)}
              >
                Continue with {selectedTierConfig.name}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select template */}
        {step === 2 && (
          <div className="step-content">
            <button type="button" className="step-back-btn" onClick={() => goBack(1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Change plan
            </button>
            <h1 className="step-title">Choose Your Invitation Design</h1>
            <p className="step-subtitle">{selectedTierConfig.name} plan selected. Pick the theme that matches your wedding vision.</p>

            <div className="template-grid">
              {templates.map(t => (
                <button
                  key={t._id}
                  type="button"
                  className={`template-option ${selectedTemplate?._id === t._id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  <div className="template-option-image">
                    {TEMPLATE_PREVIEW_CARDS[t.slug] && t.previewImage ? (
                      <div
                        className="template-option-design-image"
                        style={{ backgroundImage: `${TEMPLATE_PREVIEW_CARDS[t.slug].overlay}, url(${t.previewImage})` }}
                      >
                        <span className="template-option-design-text">{TEMPLATE_PREVIEW_CARDS[t.slug].previewText}</span>
                      </div>
                    ) : t.previewImage ? (
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
                type="button"
                className="btn btn-gold step-next"
                disabled={!selectedTemplate}
                onClick={() => goToStep(3)}
              >
                Continue with {selectedTemplate?.name || '...'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fill form */}
        {step === 3 && (
          <div className="step-content">
            <button type="button" className="step-back-btn" onClick={() => goBack(2)}>
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
                <div className="form-grid form-grid--contact">
                  <div className="form-field">
                    <label>Your Full Name *</label>
                    <input type="text" required value={form.customerName} onChange={e => handleInput('customerName', e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="form-field">
                    <label>Email Address *</label>
                    <input type="email" required value={form.customerEmail} onChange={e => handleInput('customerEmail', e.target.value)} placeholder="you@example.com" autoComplete="email" />
                    <p className="form-hint message-hint">Your invitation link and private code will be sent here.</p>
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
                    <div className="time-format-toggle" role="group" aria-label="Time format">
                      <button
                        type="button"
                        className={form.timeFormat !== '24h' ? 'active' : ''}
                        onClick={() => handleInput('timeFormat', '12h')}
                      >
                        12h
                      </button>
                      <button
                        type="button"
                        className={form.timeFormat === '24h' ? 'active' : ''}
                        onClick={() => handleInput('timeFormat', '24h')}
                      >
                        24h
                      </button>
                    </div>
                    <p className="form-hint message-hint">Shown as {formatOrderTime(form.weddingTime || '17:30', form.timeFormat || '12h')} on the invitation.</p>
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

              {/* Invitation font — its own section */}
              <fieldset className="form-section form-section--optional">
                <legend>Invitation Font</legend>
                <button
                  type="button"
                  className="font-select-card"
                  onClick={() => setFontPickerOpen(true)}
                >
                  <span className="font-select-preview" style={{ fontFamily: selectedFontOption.display }}>
                    Aa
                  </span>
                  <span className="font-select-copy">
                    <span className="font-select-label">Invitation font</span>
                    <strong>{selectedFontOption.label}</strong>
                  </span>
                  <span className="font-select-action">
                    Change
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                  </span>
                </button>
              </fieldset>

              {/* Message — its own section */}
              {optionalFields.some(f => f.key === 'message' || f.key === 'coupleMessage') && (
                <fieldset className="form-section form-section--optional">
                  <legend>Message</legend>
                  <div className="form-grid">
                    {optionalFields.filter(f => f.key === 'message' || f.key === 'coupleMessage').map(field => (
                      <div key={field.key} className={`form-field form-field--wide ${disabledFields.includes(field.key) ? 'field-disabled' : ''}`}>
                        <div className="field-header">
                          <label>{field.label}</label>
                          <button type="button" className="field-toggle" onClick={() => toggleField(field.key)}>
                            {disabledFields.includes(field.key) ? 'Enable' : 'Disable'}
                          </button>
                        </div>
                        {!disabledFields.includes(field.key) && (
                          field.key === 'message' ? (
                            <>
                              <textarea
                                className="message-textarea"
                                value={form[field.key]}
                                onChange={e => handleInput(field.key, e.target.value)}
                                rows={3}
                              />
                              <p className="form-hint message-hint">
                                This line appears on the invitation. Edit it, or clear it to remove it.
                              </p>
                            </>
                          ) : (
                            <>
                              <textarea
                                className="message-textarea message-textarea--tall"
                                value={form[field.key]}
                                onChange={e => handleInput(field.key, e.target.value)}
                                rows={5}
                              />
                              <p className="form-hint message-hint">
                                Shown inside the envelope. Edit it, or clear it to remove this note.
                              </p>
                            </>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* RSVP — its own section: responses, guidance and the plus-one question */}
              {optionalFields.some(f => f.key === 'rsvp') && (
                <fieldset className="form-section form-section--optional">
                  <legend>RSVP</legend>
                  <div className={`form-field form-field--wide ${disabledFields.includes('rsvp') ? 'field-disabled' : ''}`}>
                    <div className="field-header">
                      <label>RSVP Section</label>
                      <button type="button" className="field-toggle" onClick={() => toggleField('rsvp')}>
                        {disabledFields.includes('rsvp') ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                    {!disabledFields.includes('rsvp') && (
                      <>
                        <p className="form-hint" style={{ margin: 0 }}>Guests will be able to RSVP directly from your invitation.</p>
                        <div className="guest-policy-block">
                          <div className="guest-policy-section-head">
                            <p className="form-hint">Ask guests whether they're bringing a plus-one.</p>
                            <button
                              type="button"
                              className={`guest-policy-card-toggle ${form.askPlusOne ? 'is-on' : 'is-off'}`}
                              role="switch"
                              aria-checked={form.askPlusOne}
                              onClick={() => handleInput('askPlusOne', !form.askPlusOne)}
                            >
                              <span className="guest-policy-switch-track"><span className="guest-policy-switch-thumb" /></span>
                              {form.askPlusOne ? 'On' : 'Off'}
                            </button>
                          </div>
                        </div>
                        {guestGuidanceFields}
                      </>
                    )}
                  </div>
                </fieldset>
              )}

              {/* Venue Photos
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
                      <InvitationPhoto src={photo} alt={`Venue ${i + 1}`} />
                      <div className="photo-fit-controls" role="group" aria-label={`Venue photo ${i + 1} fit`}>
                        {PHOTO_FIT_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`photo-fit-btn ${(photo.fit || DEFAULT_PHOTO_FIT) === option.value ? 'active' : ''}`}
                            onClick={() => setPhotoFit('venue', i, option.value)}
                            title={option.hint}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {photo._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                      {photo._failed && <div className="photo-failed-badge" title="Upload failed — remove and re-add">!</div>}
                      <button type="button" className="photo-remove" onClick={() => removePhoto('venue', i)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>
              */}

              {/* Our Story — each milestone has its own text fields + optional photo */}
              {storyIncluded && (
              <fieldset className="form-section story-form-section">
                <legend>Our Story</legend>
                <p className="form-hint">Add milestones from your journey together — first date, proposal, and more. Each one appears on your invitation timeline.</p>
                {uploadError && <p className="photo-error">{uploadError}</p>}
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
                      <div className="story-milestone-photo" style={storyPreviewStyle}>
                        {photos.story[i] ? (
                          <>
                            <InvitationPhoto src={photos.story[i]} alt={`Story ${i + 1}`} />
                            <div className="photo-fit-controls" role="group" aria-label={`Story photo ${i + 1} fit`}>
                              {PHOTO_FIT_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`photo-fit-btn ${(photos.story[i].fit || DEFAULT_PHOTO_FIT) === option.value ? 'active' : ''}`}
                                  onClick={() => setPhotoFit('story', i, option.value)}
                                  title={option.hint}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            {photos.story[i]._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                            {photos.story[i]._failed && <div className="photo-failed-badge" title="Upload failed">!</div>}
                            <button type="button" className="photo-remove" onClick={() => removePhoto('story', i)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </>
                        ) : (
                          <label className="photo-upload-btn photo-upload-btn--square photo-upload-btn--template" style={storyPreviewStyle}>
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
                                updated[i] = { url: URL.createObjectURL(file), publicId: '', label: 'story', fit: DEFAULT_PHOTO_FIT, _uploading: true, _localId: localId, _thumbUrl: thumbUrl };
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
              )}

              {/* Gallery Photos */}
              {galleryIncluded && (
              <fieldset className="form-section">
                <legend>Gallery</legend>
                <p className="form-hint">Additional photos for the gallery section (max 6)</p>
                <div className="photo-upload-area photo-upload-area--gallery">
                  {photos.gallery.length < 6 && (
                    <label className="photo-upload-btn photo-upload-btn--gallery-add" style={galleryPreviewStyle}>
                      <span className="photo-upload-plus" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </span>
                      <span className="photo-upload-plus-label">Add photo</span>
                      <input type="file" multiple accept="image/*,.heic,.heif" onChange={e => handlePhotoUpload(e, 'gallery')} style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />
                    </label>
                  )}
                  {photos.gallery.map((photo, i) => (
                    <div
                      key={photo._localId || i}
                      className={`photo-preview photo-preview--template photo-preview--gallery ${photo._failed ? 'photo-failed' : ''}`}
                      style={galleryPreviewStyle}
                    >
                      <InvitationPhoto src={photo} alt={`Gallery ${i + 1}`} />
                      <div className="photo-fit-controls" role="group" aria-label={`Gallery photo ${i + 1} fit`}>
                        {PHOTO_FIT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`photo-fit-btn ${(photo.fit || DEFAULT_PHOTO_FIT) === option.value ? 'active' : ''}`}
                            onClick={() => setPhotoFit('gallery', i, option.value)}
                            title={option.hint}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {photo._uploading && <div className="photo-upload-badge" title="Uploading…" />}
                      {photo._failed && <div className="photo-failed-badge" title="Upload failed — remove and re-add">!</div>}
                      <button type="button" className="photo-remove" onClick={() => removePhoto('gallery', i)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>
              )}

              {/* Submit */}
              <div className="form-submit">
                <div className="price-summary">
                  <span className="price-label">Total</span>
                  <span className="price-value">{displayPrice}</span>
                </div>
                <button type="submit" className="btn btn-gold form-pay-btn">
                  Review
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Review & Confirm Payment */}
        {step === 4 && (
          <div className="step-content">
            {!paypalOrderData && (
              <button type="button" className="step-back-btn" onClick={() => goBack(3)}>
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
                  <img
                    src={selectedTemplate.previewImage}
                    alt={selectedTemplate.name}
                  />
                  <div>
                    <strong>{selectedTemplate.name}</strong>
                    <p>{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h3 className="review-section-title">Invitation Preview</h3>
                <button
                  type="button"
                  className="protected-preview-card"
                  onClick={() => setPreviewOpen(true)}
                >
                  <span className="protected-preview-thumb" aria-hidden="true">
                    {selectedTemplate.previewImage && <img src={selectedTemplate.previewImage} alt="" />}
                    <span className="protected-preview-thumb-watermark">Preview</span>
                  </span>
                  <span className="protected-preview-copy">
                    <strong>Preview invitation</strong>
                    <span>Open the mobile guest view.</span>
                  </span>
                  <span className="protected-preview-action">
                    View
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                  </span>
                </button>
              </div>

              <div className="review-section">
                <h3 className="review-section-title">Contact Info</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Name</span><span>{form.customerName}</span></div>
                  <div className="review-item"><span className="review-label">Email</span><span>{form.customerEmail}</span></div>
                </div>
              </div>

              <div className="review-section">
                <h3 className="review-section-title">Wedding Details</h3>
                <div className="review-grid">
                  <div className="review-item"><span className="review-label">Partner 1</span><span>{form.groomName}</span></div>
                  <div className="review-item"><span className="review-label">Partner 2</span><span>{form.brideName}</span></div>
                  {form.weddingDate && <div className="review-item"><span className="review-label">Date</span><span>{new Date(form.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>}
                  {form.weddingTime && fieldEnabled('weddingTime') && <div className="review-item"><span className="review-label">Time</span><span>{formatOrderTime(form.weddingTime, form.timeFormat || '12h')}</span></div>}
                  <div className="review-item"><span className="review-label">Venue</span><span>{form.venue}</span></div>
                  <div className="review-item"><span className="review-label">Plan</span><span>{selectedTierConfig.name}</span></div>
                  {getGuestPolicyText(form) && (
                    <div className="review-item review-item--wide">
                      <span className="review-label">Guest Policy</span>
                      <span>{getGuestPolicyText(form)}</span>
                    </div>
                  )}
                  {form.coupleMessage && fieldEnabled('coupleMessage') && <div className="review-item review-item--wide"><span className="review-label">Envelope Message</span><span className="review-item-message">{form.coupleMessage}</span></div>}
                </div>
              </div>

              {tieredPhotos.length > 0 && (
                <div className="review-section">
                  <h3 className="review-section-title">Photos ({tieredPhotos.length})</h3>
                  {[
                    { key: 'venue', label: 'Venue' },
                    { key: 'story', label: 'Our Story' },
                    { key: 'gallery', label: 'Gallery' },
                  ].map(group => {
                    const groupPhotos = tieredPhotos.filter(p => (p.label || 'gallery') === group.key);
                    if (groupPhotos.length === 0) return null;
                    return (
                      <div className="review-photo-group" key={group.key}>
                        <span className="review-photo-group-title">{group.label} ({groupPhotos.length})</span>
                        <div className="review-photos">
                          {groupPhotos.map((p, i) => (
                            <div
                              key={i}
                              className="review-photo-item"
                              style={getUploadPreviewStyle(selectedTemplate?.slug, p.label)}
                            >
                              <div className="review-photo">
                                <InvitationPhoto src={p} alt={`${group.label} ${i + 1}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {musicIncluded && music.url && !music.uploading && !music.failed && music.enabled && (
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
                    <span className="price-value">{displayPrice}</span>
                  </div>
                  <p className="payment-note">A confirmation email with your invitation link will be sent after payment.</p>
                </div>
                <button type="button" className="btn btn-gold form-pay-btn" onClick={handleConfirmPayment} disabled={confirming}>
                  {confirming ? 'Preparing Payment…' : 'Continue to Payment'}
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
                      <dd>{paymentDisplayPrice}</dd>
                    </div>
                    <div className="payment-summary-row payment-summary-grand">
                      <dt>Total due today</dt>
                      <dd>{paymentDisplayPrice}</dd>
                    </div>
                  </div>
                  <button type="button" className="payment-summary-edit" onClick={() => {
                    setPaypalOrderData(null);
                    setPaypalLoading(false);
                    setCardFieldsReady(false);
                    setCardFieldsEligible(false);
                    setCardSubmitting(false);
                  }}>
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
                            setCardError('');
                            setPaypalOrderData(null);
                            setPaypalLoading(false);
                            setCardFieldsReady(false);
                            setCardFieldsEligible(false);
                            setCardSubmitting(false);
                            handleConfirmPayment();
                          }}
                        >
                          Start a new payment
                        </button>
                      </div>
                    )}

                    {!needsRetry && (
                      <div className="card-pay-fallback">
                        <div className="veloura-card-form" aria-label="Card payment form">
                          <div className="veloura-card-form-head">
                            <h4>Card details</h4>
                            <span className="veloura-card-secure">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              Secured by PayPal
                            </span>
                          </div>

                          <div className="veloura-card-fields">
                            <label className="veloura-card-field">
                              <span>Name on card</span>
                              <div ref={cardNameRef} className="veloura-card-hosted-field" />
                            </label>
                            <label className="veloura-card-field">
                              <span>Card number</span>
                              <div ref={cardNumberRef} className="veloura-card-hosted-field" />
                            </label>
                            <label className="veloura-card-field veloura-card-field--half">
                              <span>Expiry date</span>
                              <div ref={cardExpiryRef} className="veloura-card-hosted-field" />
                            </label>
                            <label className="veloura-card-field veloura-card-field--half">
                              <span>CVV</span>
                              <div ref={cardCvvRef} className="veloura-card-hosted-field" />
                            </label>
                          </div>

                          {!cardFieldsEligible && !paypalLoading && (
                            <p className="veloura-card-unavailable">
                              Card fields are not available for this PayPal account or browser. You can still use the PayPal button below.
                            </p>
                          )}

                          {cardError && (
                            <p className="veloura-card-error" role="alert">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              {cardError}
                            </p>
                          )}

                          <button
                            type="button"
                            className="btn btn-gold veloura-card-submit"
                            onClick={handleCardPayment}
                            disabled={!cardFieldsReady || cardSubmitting || paypalLoading}
                          >
                            <span>{cardSubmitting ? 'Processing...' : 'Pay now'}</span>
                            {!cardSubmitting && (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14" />
                                <path d="M13 6l6 6-6 6" />
                              </svg>
                            )}
                          </button>
                        </div>

                        <div className="veloura-wallet-divider"><span>PayPal wallet</span></div>
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

      {previewOpen && (
        <div
          className="invitation-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitation-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewOpen(false);
          }}
        >
          <div className="invitation-preview-panel">
            <div className="invitation-preview-header">
              <h2 id="invitation-preview-title">Preview</h2>
              <button
                type="button"
                className="invitation-preview-close"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close invitation preview"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="invitation-preview-shell">
              <div
                className="invitation-preview-device"
                onContextMenu={(event) => event.preventDefault()}
                onCopy={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
                onSubmitCapture={(event) => event.preventDefault()}
              >
                {PreviewInvitationComponent ? (
                  <InvitationPreviewFrame className="invitation-preview-frame" title="Invitation preview">
                    <Suspense fallback={<div className="invitation-preview-loading">Loading preview...</div>}>
                      <PreviewInvitationComponent
                        key={`${selectedTemplate?.slug || 'template'}-preview`}
                        order={previewOrder}
                        demo={false}
                        publicSlug="preview"
                      />
                    </Suspense>
                  </InvitationPreviewFrame>
                ) : (
                  <div className="invitation-preview-unavailable">
                    <h3>Preview unavailable</h3>
                    <p>This design cannot be rendered in the order preview yet.</p>
                  </div>
                )}
                <div className="invitation-preview-watermark" aria-hidden="true">
                  {Array.from({ length: 60 }, (_, index) => (
                    <span key={index}>VELOURA PREVIEW</span>
                  ))}
                </div>
                <div className="invitation-preview-center-mark" aria-hidden="true">
                  VELOURA PREVIEW
                </div>
              </div>
            </div>

            <p className="invitation-preview-footer">This is exactly how your invitation will look. Final version is delivered after payment.</p>
          </div>
        </div>
      )}

      {policyPickerOpen && (
        <div
          className="policy-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPolicyPickerOpen(null);
          }}
        >
          <div className="policy-picker-panel">
            <div className="policy-picker-header">
              <div>
                <span className="policy-picker-eyebrow">Guest wording</span>
                <h2 id="policy-picker-title">
                  {policyPickerOpen === 'children' ? 'Children guidance' : 'Plus-one guidance'}
                </h2>
              </div>
              <button
                type="button"
                className="policy-picker-close"
                onClick={() => setPolicyPickerOpen(null)}
                aria-label="Close guest wording picker"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="policy-option-list">
              {GUEST_POLICY_OPTIONS[policyPickerOpen].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`policy-option-card ${form[policyPickerOpen === 'children' ? 'childrenPolicy' : 'plusOnePolicy'] === option.value ? 'active' : ''}`}
                  onClick={() => applyGuestPolicyPreset(policyPickerOpen, option)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {fontPickerOpen && (
        <div
          className="font-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="font-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFontPickerOpen(false);
          }}
        >
          <div className="font-picker-panel">
            <div className="font-picker-header">
              <div>
                <span className="font-picker-eyebrow">Invitation typography</span>
                <h2 id="font-picker-title">Choose a font style</h2>
              </div>
              <div className="font-picker-header-actions">
                <button
                  type="button"
                  className="font-picker-reset"
                  disabled={normalizeInvitationFont(form.invitationFont) === DEFAULT_INVITATION_FONT}
                  onClick={() => handleInput('invitationFont', DEFAULT_INVITATION_FONT)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                  Revert to original
                </button>
                <button
                  type="button"
                  className="font-picker-close"
                  onClick={() => setFontPickerOpen(false)}
                  aria-label="Close font picker"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <div className="font-option-grid">
              {INVITATION_FONT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`font-option-card ${normalizeInvitationFont(form.invitationFont) === option.value ? 'active' : ''}`}
                  onClick={() => {
                    handleInput('invitationFont', option.value);
                    setFontPickerOpen(false);
                  }}
                >
                  <span className="font-option-sample" style={{ fontFamily: option.script }}>
                    Amira &amp; Zayn
                  </span>
                  <span className="font-option-body" style={{ fontFamily: option.body }}>
                    Saturday, 20 June 2026
                  </span>
                  <span className="font-option-name">{option.label}</span>
                  <span className="font-option-check" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
