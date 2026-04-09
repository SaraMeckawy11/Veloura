import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const PHOTO_CATEGORIES = {
  couple: { label: 'Couple Photos', max: 3 },
  venue: { label: 'Venue Photos', max: 2 },
  story: { label: 'Our Story Photos', max: 4 },
  gallery: { label: 'Gallery Photos', max: 6 },
};

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
  const [editPhotos, setEditPhotos] = useState({ couple: [], venue: [], story: [], gallery: [] });
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
    const categorized = { couple: [], venue: [], story: [], gallery: [] };
    allPhotos.forEach(p => {
      const cat = p.label && categorized[p.label] ? p.label : 'gallery';
      categorized[cat].push(p);
    });
    setEditPhotos(categorized);
    setEditing(true);
    setSaveMsg('');
  };

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
      items.map(p => ({ ...p, label: p.label || cat }))
    );
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`${API}/orders/edit/${editToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingDetails: {
            groomName: editForm.groomName,
            brideName: editForm.brideName,
            weddingDate: editForm.weddingDate || undefined,
            weddingTime: editForm.weddingTime || undefined,
            venue: editForm.venue,
            venueAddress: editForm.venueAddress || undefined,
            venueMapUrl: editForm.venueMapUrl || undefined,
            message: editForm.message || undefined,
            secondLanguage: editForm.secondLanguage || undefined,
          },
          photos: flattenEditPhotos(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      // Refresh order data
      const updated = await fetch(`${API}/orders/dashboard/${editToken}`).then(r => r.json());
      setOrder(updated);
      setEditing(false);
      setSaveMsg(`Saved! ${data.editsRemaining} edits remaining.`);
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
          </div>
          <div className={`dash-status status-${order.status}`}>{order.status}</div>
        </div>

        {/* Quick links */}
        <div className="dash-links">
          <div className="dash-link-card">
            <div className="dash-link-info">
              <span className="dash-link-label">Invitation Link</span>
              <code>{inviteUrl}</code>
            </div>
            <button className="dash-copy-btn" onClick={() => copyLink(inviteUrl, 'invite')}>
              {copied === 'invite' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="dash-link-card">
            <div className="dash-link-info">
              <span className="dash-link-label">Edit Link ({order.editsRemaining} edits left)</span>
              <code>{editUrl}</code>
            </div>
            <button className="dash-edit-btn" onClick={startEditing} disabled={order.editsRemaining <= 0}>
              {editing ? 'Editing...' : 'Edit'}
            </button>
          </div>
        </div>

        {saveMsg && <div className="order-success-msg">{saveMsg}</div>}

        {/* Edit form */}
        {editing && (
          <div className="dash-section dash-edit-section">
            <h2 className="dash-section-title">Edit Wedding Details</h2>
            <div className="edit-form">
              <div className="form-grid">
                <div className="form-field">
                  <label>Partner 1 Name</label>
                  <input type="text" value={editForm.groomName} onChange={e => handleEditInput('groomName', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Partner 2 Name</label>
                  <input type="text" value={editForm.brideName} onChange={e => handleEditInput('brideName', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Wedding Date</label>
                  <input type="date" value={editForm.weddingDate} onChange={e => handleEditInput('weddingDate', e.target.value)} />
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

              <div className="edit-photos-section">
                <label className="edit-photos-label">Photos</label>
                <p className="form-hint">Manage photos by category. Each category appears in its own section of the invitation.</p>
                {[
                  { key: 'couple', label: 'Couple Photos', max: 3 },
                  { key: 'venue', label: 'Venue Photos', max: 2 },
                  { key: 'story', label: 'Our Story Photos', max: 4 },
                  { key: 'gallery', label: 'Gallery Photos', max: 6 },
                ].map(cat => (
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
                    <th>Dietary</th>
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
                      <td>{r.dietaryPreferences || '—'}</td>
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
