import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/MyInvitation.css';

const API = import.meta.env.VITE_API_URL || '/api';

export default function MyInvitation() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/orders/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      navigate(`/dashboard/${data.editToken}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="portal-page">
      <div className="portal-container">
        <Link to="/" className="portal-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Home
        </Link>

        <div className="portal-card">
          <div className="portal-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 8l10 6 10-6" />
            </svg>
          </div>

          <h1 className="portal-title">My Invitation</h1>
          <p className="portal-subtitle">
            Enter your invitation code to access your dashboard, manage RSVPs, and edit your invitation.
          </p>

          <form onSubmit={handleSubmit} className="portal-form">
            <div className="portal-input-group">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="e.g. a1b2c3d4e5"
                className={`portal-input${error ? ' has-error' : ''}`}
                disabled={loading}
                autoFocus
              />
              <button type="submit" className="portal-submit" disabled={loading || !code.trim()}>
                {loading ? (
                  <span className="portal-spinner" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                )}
              </button>
            </div>
            {error && <p className="portal-error">{error}</p>}
          </form>

          <div className="portal-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Your invitation code was sent to your email when you placed your order. Keep it private — never share it with guests.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
