import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

const API = import.meta.env.VITE_API_URL || '/api';
const PHOTO_CATEGORIES = {
  venue: { label: 'Venue Photos', max: 2 },
  story: { label: 'Our Story Photos', max: 4 },
  gallery: { label: 'Gallery Photos', max: 6 },
};
const NON_STORY_CATEGORIES = [
  { key: 'venue', label: 'Venue Photos', max: 2 },
  { key: 'gallery', label: 'Gallery Photos', max: 6 },
];

export default function Dashboard() {
  const { editToken } = useParams();
  const location = useLocation();
  const isEditRoute = location.pathname.startsWith('/edit/');

  const [order, setOrder] = useState(null);
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editPhotos, setEditPhotos] = useState({ venue: [], story: [], gallery: [] });
  const [editStoryMilestones, setEditStoryMilestones] = useState([]);
  const [photoUploading, setPhotoUploading] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/orders/dashboard/${editToken}`).then(r => r.json()),
      fetch(`${API}/rsvps/dashboard/${editToken}`).then(r => r.json()),
    ])
      .then(([orderData, rsvps]) => {
        if (orderData.error) { setError(orderData.error); }
        else { setOrder(orderData); setRsvpData(rsvps); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  }, [editToken]);

  // Auto-enter edit mode if route is /edit/:token
  useEffect(() => {
    if (isEditRoute && order && !editing) {
      startEditing();
    }
  }, [isEditRoute, order]);

  const startEditing = () => {
    const wd = order.weddingDetails || {};
    setEditForm({
      groomName: wd.groomName || '',
      brideName: wd.brideName || '',
      weddingDate: wd.weddingDate ? wd.weddingDate.slice(0, 10) : '',
      weddingTime: wd.weddingTime || '',
      venue: wd.venue || '',
      venueAddress: wd.venueAddress || '',
      venueMapUrl: wd.venueMapUrl || '',
      message: wd.message || '',
      secondLanguage: wd.secondLanguage || '',
    });
    // Categorize existing photos
    const allPhotos = order.photos || [];
    const categorized = { venue: [], story: [], gallery: [] };
    allPhotos.forEach(p => {
      const cat = p.label && categorized[p.label] ? p.label : 'gallery';
      categorized[cat].push(p);
    });
    setEditPhotos(categorized);
    const existingMilestones = Array.isArray(order.storyMilestones) ? order.storyMilestones : [];
    const visibleStoryCount = Math.min(
      PHOTO_CATEGORIES.story.max,
      Math.max(existingMilestones.length, categorized.story.length, 1)
    );
    setEditStoryMilestones(
      Array.from({ length: visibleStoryCount }, (_, i) => {
        const milestone = existingMilestones[i] || {};
        return {
          date: milestone.date || '',
          title: milestone.title || '',
          description: milestone.description || '',
        };
      })
    );
    setEditing(true);
    setSaveMsg('');
  };

  const handleStoryMilestoneChange = (index, key, value) => {
    setEditStoryMilestones(prev => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  };
  const addStoryMilestone = () => {
    setEditStoryMilestones(prev => (prev.length >= 4 ? prev : [...prev, { date: '', title: '', description: '' }]));
  };
  const removeStoryMilestone = (index) => {
    setEditStoryMilestones(prev => prev.filter((_, i) => i !== index));
    // Keep story photos aligned with milestones — drop the photo at the removed index.
    setEditPhotos(prev => ({ ...prev, story: prev.story.filter((_, i) => i !== index) }));
  };

  const handleStoryPhotoUpload = async (e, index) => {
    const files = e.target.files;
    if (!files.length) return;
    setPhotoUploading(prev => ({ ...prev, [`story-${index}`]: true }));
    const formData = new FormData();
    formData.append('photos', files[0]);
    try {
      const res = await fetch(`${API}/upload?category=story`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.files && data.files[0]) {
        setEditPhotos(prev => {
          const updated = [...prev.story];
          updated[index] = data.files[0];
          return { ...prev, story: updated };
        });
      }
    } catch {
      setSaveMsg('Photo upload failed');
    }
    e.target.value = '';
    setPhotoUploading(prev => ({ ...prev, [`story-${index}`]: false }));
  };

  const removeStoryPhoto = (index) => {
    setEditPhotos(prev => {
      const updated = [...prev.story];
      updated[index] = undefined;
      return { ...prev, story: updated };
    });
  };

  // Compute whether names are editable (within 48h grace period + has remaining edits)
  const nameEditable = (() => {
    if (!order || order.status !== 'active') return false;
    if ((order.nameEditsRemaining ?? 0) <= 0) return false;
    if (!order.activatedAt) return false;
    const graceMs = (order.nameGraceHours || 48) * 60 * 60 * 1000;
    return (Date.now() - new Date(order.activatedAt).getTime()) < graceMs;
  })();

  // Compute human-readable time remaining for grace period
  const nameGraceRemaining = (() => {
    if (!order?.activatedAt) return null;
    const graceMs = (order.nameGraceHours || 48) * 60 * 60 * 1000;
    const remaining = graceMs - (Date.now() - new Date(order.activatedAt).getTime());
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  })();

  // Whether wedding date is editable
  const dateEditable = order && (order.dateEditsRemaining ?? 2) > 0;

  const handleEditInput = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleEditPhotoUpload = async (e, category) => {
    const files = e.target.files;
    if (!files.length) return;
    const config = PHOTO_CATEGORIES[category];
    const remaining = Math.max(0, config.max - editPhotos[category].length);
    if (!remaining) {
      setSaveMsg(`Maximum ${config.max} photos allowed for ${config.label}.`);
      e.target.value = '';
      return;
    }
    setPhotoUploading(prev => ({ ...prev, [category]: true }));
    const formData = new FormData();
    Array.from(files)
      .slice(0, remaining)
      .forEach((f) => formData.append('photos', f));

    try {
      const res = await fetch(`${API}/upload?category=${category}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.files) setEditPhotos(prev => ({ ...prev, [category]: [...prev[category], ...data.files] }));
    } catch {
      setSaveMsg('Photo upload failed');
    }
    e.target.value = '';
    setPhotoUploading(prev => ({ ...prev, [category]: false }));
  };

  const removeEditPhoto = (category, index) => {
    setEditPhotos(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  const flattenEditPhotos = () => {
    return Object.entries(editPhotos).flatMap(([cat, items]) =>
      items.filter(Boolean).map(p => ({ ...p, label: p.label || cat }))
    );
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const weddingDetailsPayload = {
        weddingDate: editForm.weddingDate || undefined,
        weddingTime: editForm.weddingTime || undefined,
        venue: editForm.venue,
        venueAddress: editForm.venueAddress || undefined,
        venueMapUrl: editForm.venueMapUrl || undefined,
        message: editForm.message || undefined,
        secondLanguage: editForm.secondLanguage || undefined,
      };
      // Include name fields if they were editable (grace period)
      if (nameEditable) {
        weddingDetailsPayload.groomName = editForm.groomName;
        weddingDetailsPayload.brideName = editForm.brideName;
      }
      const cleanedMilestones = editStoryMilestones
        .map(m => ({
          date: (m.date || '').trim(),
          title: (m.title || '').trim(),
          description: (m.description || '').trim(),
        }))
        .filter(m => m.date || m.title || m.description);
      const res = await fetch(`${API}/orders/edit/${editToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingDetails: weddingDetailsPayload,
          photos: flattenEditPhotos(),
          storyMilestones: cleanedMilestones,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      // Refresh order data
      const updated = await fetch(`${API}/orders/dashboard/${editToken}`).then(r => r.json());
      setOrder(updated);
      setEditing(false);
      const parts = [`Saved! ${data.editsRemaining} edits remaining.`];
      if (data.nameEditsRemaining !== undefined && data.nameEditsRemaining <= 0) {
        parts.push('Couple names are now locked.');
      }
      if (data.dateEditsRemaining !== undefined && data.dateEditsRemaining <= 0) {
        parts.push('Wedding date is now locked.');
      }
      setSaveMsg(parts.join(' '));
    } catch (err) {
      setSaveMsg(err.message);
    }
    setSaving(false);
  };

  const copyLink = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-container"><div className="dash-loading">Loading your dashboard...</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page">
        <div className="dash-container">
          <div className="dash-error">{error}</div>
          <Link to="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const inviteUrl = `${window.location.origin}/i/${order.publicSlug}`;
  const editUrl = `${window.location.origin}/edit/${editToken}`;
  const wd = order.weddingDetails || {};

  return (
    <div className="dash-page">
      <div className="dash-container">
        <div className="dash-header">
          <div>
            <Link to="/" className="dash-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Home
            </Link>
            <h1 className="dash-title">
              {wd.groomName && wd.brideName
                ? `${wd.groomName} & ${wd.brideName}`
                : 'Your Wedding'}
            </h1>
            <p className="dash-subtitle">Private dashboard — do not share this link</p>
            {order.invitationCode && (
              <div className="dash-code-row">
                <span className="dash-code-label">Invitation code</span>
                <code className="dash-code-value">{order.invitationCode}</code>
                <button type="button" className="dash-code-copy" onClick={() => copyLink(order.invitationCode, 'code')} title="Copy code">
                  {copied === 'code' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <div className={`dash-status status-${order.status}`}>{order.status}</div>
        </div>

        {/* Quick actions */}
        <div className="dash-actions-bar">
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="dash-action-btn dash-action-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            Open Invitation
          </a>
          <button className="dash-action-btn" onClick={startEditing} disabled={order.editsRemaining <= 0 || editing}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            {editing ? 'Editing...' : `Edit (${order.editsRemaining} left)`}
          </button>
          <button className="dash-action-btn" onClick={() => {
            const intro = `You're invited to ${wd.groomName && wd.brideName ? `${wd.groomName} & ${wd.brideName}'s` : 'our'} wedding! View the invitation here:`;
            if (navigator.share) {
              navigator.share({ title: 'Wedding Invitation', text: intro, url: inviteUrl });
            } else {
              copyLink(`${intro} ${inviteUrl}`, 'share');
            }
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            {copied === 'share' ? 'Copied!' : 'Share Invitation'}
          </button>
        </div>

        {saveMsg && <div className="order-success-msg">{saveMsg}</div>}

        {/* Edit form */}
        {editing && (
          <div className="dash-section dash-edit-section">
            <h2 className="dash-section-title">Edit Wedding Details</h2>
            <div className="edit-form">
              <div className="form-grid">
                {nameEditable ? (
                  <>
                    <div className="form-field">
                      <label>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        Partner 1 Name
                      </label>
                      <input type="text" value={editForm.groomName} onChange={e => handleEditInput('groomName', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                        Partner 2 Name
                      </label>
                      <input type="text" value={editForm.brideName} onChange={e => handleEditInput('brideName', e.target.value)} />
                    </div>
                    <div className="field-grace-notice full-width">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      You have <strong>1 name correction</strong> available.
                      {nameGraceRemaining && <> Window closes in <strong>{nameGraceRemaining}</strong>.</>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-field field-locked">
                      <label>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Partner 1 Name
                      </label>
                      <div className="field-locked-value">{editForm.groomName}</div>
                    </div>
                    <div className="form-field field-locked">
                      <label>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Partner 2 Name
                      </label>
                      <div className="field-locked-value">{editForm.brideName}</div>
                    </div>
                    <p className="field-locked-notice full-width">
                      {order.nameEditsRemaining <= 0
                        ? 'Name correction has been used. Couple names are now permanently locked.'
                        : 'The 48-hour name correction window has expired. Couple names are now locked.'}
                    </p>
                  </>
                )}
                <div className={`form-field ${dateEditable ? '' : 'field-locked'}`}>
                  <label>
                    {dateEditable ? '' : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    )}
                    Wedding Date {dateEditable && order.dateEditsRemaining !== undefined && (
                      <span className="field-edit-count">({order.dateEditsRemaining} change{order.dateEditsRemaining === 1 ? '' : 's'} left)</span>
                    )}
                  </label>
                  {dateEditable ? (
                    <input type="date" value={editForm.weddingDate} onChange={e => handleEditInput('weddingDate', e.target.value)} />
                  ) : (
                    <div className="field-locked-value">{editForm.weddingDate ? new Date(editForm.weddingDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
                  )}
                </div>
                <div className="form-field">
                  <label>Wedding Time</label>
                  <input type="time" value={editForm.weddingTime} onChange={e => handleEditInput('weddingTime', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Venue Name</label>
                  <input type="text" value={editForm.venue} onChange={e => handleEditInput('venue', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Venue Address</label>
                  <input type="text" value={editForm.venueAddress} onChange={e => handleEditInput('venueAddress', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Google Maps Link</label>
                  <input type="url" value={editForm.venueMapUrl} onChange={e => handleEditInput('venueMapUrl', e.target.value)} />
                </div>
                <div className="form-field full-width">
                  <label>Personal Message</label>
                  <textarea rows={3} value={editForm.message} onChange={e => handleEditInput('message', e.target.value)} />
                </div>
                <div className="form-field full-width">
                  <label>Second Language Text</label>
                  <textarea rows={3} value={editForm.secondLanguage} onChange={e => handleEditInput('secondLanguage', e.target.value)} />
                </div>
              </div>

              <div className="edit-story-section">
                <label className="edit-photos-label">Our Story</label>
                <p className="form-hint">Add or edit the milestones from your journey together. Each milestone has its own photo. Leave blank to skip this section on the invitation.</p>
                <div className="edit-story-list">
                  {editStoryMilestones.map((m, i) => {
                    const photo = editPhotos.story[i];
                    const uploading = photoUploading[`story-${i}`];
                    return (
                      <div key={i} className="edit-story-item edit-story-item--with-photo">
                        <div className="edit-story-item-header">
                          <span className="edit-story-number">{i + 1}</span>
                          {editStoryMilestones.length > 1 && (
                            <button type="button" className="edit-story-remove" onClick={() => removeStoryMilestone(i)} title="Remove milestone">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="edit-story-body">
                          <div className="edit-story-photo">
                            {photo ? (
                              <>
                                <img src={photo.url} alt={`Story ${i + 1}`} />
                                <button type="button" className="photo-remove" onClick={() => removeStoryPhoto(i)} title="Remove photo">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                              </>
                            ) : (
                              <label className="edit-story-photo-upload">
                                {uploading ? (
                                  <span className="edit-story-photo-uploading">Uploading…</span>
                                ) : (
                                  <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    <span>Photo</span>
                                  </>
                                )}
                                <input type="file" accept="image/*" hidden disabled={uploading} onChange={e => handleStoryPhotoUpload(e, i)} />
                              </label>
                            )}
                          </div>
                          <div className="edit-story-fields">
                            <input type="text" placeholder="Year or date (e.g. 2019)" value={m.date} onChange={e => handleStoryMilestoneChange(i, 'date', e.target.value)} />
                            <input type="text" placeholder="Title (e.g. First Meeting)" value={m.title} onChange={e => handleStoryMilestoneChange(i, 'title', e.target.value)} />
                            <textarea rows={2} placeholder="A short description of this moment..." value={m.description} onChange={e => handleStoryMilestoneChange(i, 'description', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {editStoryMilestones.length < 4 && (
                    <button type="button" className="edit-story-add" onClick={addStoryMilestone}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add milestone ({editStoryMilestones.length}/4)
                    </button>
                  )}
                </div>
              </div>

              <div className="edit-photos-section">
                <label className="edit-photos-label">Photos</label>
                <p className="form-hint">Manage photos by category. Each category appears in its own section of the invitation.</p>
                {NON_STORY_CATEGORIES.map(cat => (
                  <div key={cat.key} className="photo-category">
                    <div className="photo-category-header">
                      <h4 className="photo-category-title">{cat.label}</h4>
                      <span className="photo-category-count">{editPhotos[cat.key].length}/{cat.max}</span>
                    </div>
                    <div className="photo-upload-area">
                      {editPhotos[cat.key].length < cat.max && (
                        <label className="photo-upload-btn">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          {photoUploading[cat.key] ? 'Uploading...' : 'Add'}
                          <input type="file" multiple accept="image/*" onChange={e => handleEditPhotoUpload(e, cat.key)} disabled={photoUploading[cat.key]} hidden />
                        </label>
                      )}
                      {editPhotos[cat.key].map((photo, i) => (
                        <div key={i} className="photo-preview">
                          <img src={photo.url} alt={`${cat.label} ${i + 1}`} />
                          <button type="button" className="photo-remove" onClick={() => removeEditPhoto(cat.key, i)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="edit-actions">
                <button className="btn btn-gold" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-value">{rsvpData?.summary?.total || 0}</div>
            <div className="stat-label">Total RSVPs</div>
          </div>
          <div className="stat-card stat-yes">
            <div className="stat-value">{rsvpData?.summary?.attending || 0}</div>
            <div className="stat-label">Attending</div>
          </div>
          <div className="stat-card stat-no">
            <div className="stat-value">{rsvpData?.summary?.notAttending || 0}</div>
            <div className="stat-label">Not Attending</div>
          </div>
          <div className="stat-card stat-maybe">
            <div className="stat-value">{rsvpData?.summary?.maybe || 0}</div>
            <div className="stat-label">Maybe</div>
          </div>
          <div className="stat-card stat-guests">
            <div className="stat-value">{rsvpData?.summary?.totalGuests || 0}</div>
            <div className="stat-label">Total Guests</div>
          </div>
        </div>

        {/* Wedding details */}
        <div className="dash-section">
          <h2 className="dash-section-title">Wedding Details</h2>
          <div className="details-grid">
            {wd.weddingDate && (
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{new Date(wd.weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            {wd.weddingTime && (
              <div className="detail-item">
                <span className="detail-label">Time</span>
                <span className="detail-value">{wd.weddingTime}</span>
              </div>
            )}
            {wd.venue && (
              <div className="detail-item">
                <span className="detail-label">Venue</span>
                <span className="detail-value">{wd.venue}</span>
              </div>
            )}
            {wd.venueAddress && (
              <div className="detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{wd.venueAddress}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Template</span>
              <span className="detail-value">{order.template?.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expires</span>
              <span className="detail-value">{order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* RSVP list */}
        <div className="dash-section">
          <h2 className="dash-section-title">Guest Responses</h2>
          {rsvpData?.rsvps?.length > 0 ? (
            <div className="rsvp-table-wrap">
              <table className="rsvp-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Status</th>
                    <th>Guests</th>
                    <th>Message</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvpData.rsvps.map((r, i) => (
                    <tr key={i}>
                      <td className="rsvp-name">
                        {r.guestName}
                        {r.plusOne && r.plusOneName && <span className="plus-one">+{r.plusOneName}</span>}
                      </td>
                      <td>
                        <span className={`rsvp-badge rsvp-${r.attending}`}>
                          {r.attending === 'yes' ? 'Attending' : r.attending === 'no' ? 'Not Attending' : 'Maybe'}
                        </span>
                      </td>
                      <td>{r.guestCount}</td>
                      <td className="rsvp-msg">{r.message || '—'}</td>
                      <td className="rsvp-date">{new Date(r.respondedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rsvp-empty">
              <p>No RSVPs yet. Share your invitation link to start collecting responses!</p>
            </div>
          )}
        </div>

        {/* Guest Messages */}
        {rsvpData?.rsvps?.some(r => r.message) && (
          <div className="dash-section">
            <h2 className="dash-section-title">Guest Messages</h2>
            <div className="dash-messages-grid">
              {rsvpData.rsvps.filter(r => r.message).map((r, i) => (
                <div key={i} className="dash-message-card">
                  <p className="dash-message-text">"{r.message}"</p>
                  <div className="dash-message-footer">
                    <span className="dash-message-author">{r.guestName}</span>
                    <span className={`rsvp-badge rsvp-${r.attending}`}>
                      {r.attending === 'yes' ? 'Attending' : r.attending === 'no' ? 'Not Attending' : 'Maybe'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {order.photos?.length > 0 && (
          <div className="dash-section">
            <h2 className="dash-section-title">Uploaded Photos</h2>
            <div className="dash-photos">
              {order.photos.map((p, i) => (
                <img key={i} src={p.url} alt={`Photo ${i + 1}`} className="dash-photo" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
