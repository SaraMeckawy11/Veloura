import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/MyInvitation.css';

const API = import.meta.env.VITE_API_URL || '/api';

export default function MyInvitation() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API}/orders/lookup/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const goToDashboard = () => {
    if (result?.editToken) {
      navigate(`/dashboard/${result.editToken}`);
    }
  };

  const dateStr = result?.weddingDate
    ? new Date(result.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

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
            Enter your invitation code to access your dashboard, manage RSVPs, and share your invitation with guests.
          </p>

          <form onSubmit={handleSubmit} className="portal-form">
            <div className="portal-input-group">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); setResult(null); }}
                placeholder="e.g. jasa-a1b2c3"
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

          {result && (
            <div className="portal-result">
              <div className="portal-result-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span>Invitation Found</span>
              </div>
              <div className="portal-result-details">
                {result.coupleName && (
                  <div className="portal-result-row">
                    <span className="portal-result-label">Couple</span>
                    <span className="portal-result-value">{result.coupleName}</span>
                  </div>
                )}
                {dateStr && (
                  <div className="portal-result-row">
                    <span className="portal-result-label">Date</span>
                    <span className="portal-result-value">{dateStr}</span>
                  </div>
                )}
              </div>
              <button className="portal-go-btn" onClick={goToDashboard}>
                Open Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          <div className="portal-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>Your invitation code was sent to your email when you placed your order. Check your inbox for an email from Veloura.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
