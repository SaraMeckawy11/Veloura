import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Dashboard() {
  const { editToken } = useParams();
  const [order, setOrder] = useState(null);
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

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
            <Link to={`/edit/${editToken}`} className="dash-edit-btn">Edit</Link>
          </div>
        </div>

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
