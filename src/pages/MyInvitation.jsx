import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/MyInvitation.css';

function extractEditToken(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  // Accept either a full URL (/dashboard/<token> or /edit/<token>) or a raw token.
  const urlMatch = trimmed.match(/\/(?:dashboard|edit)\/([a-f0-9]{32,})/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  if (/^[a-f0-9]{32,}$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export default function MyInvitation() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = extractEditToken(code);
    if (!token) {
      setError('That doesn\'t look like a valid dashboard code. Paste the link from your confirmation email.');
      return;
    }
    setError('');
    navigate(`/dashboard/${token}`);
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
            Paste your private dashboard link from your confirmation email to access your dashboard, manage RSVPs, and edit your invitation.
          </p>

          <form onSubmit={handleSubmit} className="portal-form">
            <div className="portal-input-group">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="Paste your dashboard link or token"
                className={`portal-input${error ? ' has-error' : ''}`}
                autoFocus
              />
              <button type="submit" className="portal-submit" disabled={!code.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            {error && <p className="portal-error">{error}</p>}
          </form>

          <div className="portal-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span>The private link was sent to your email when you placed your order. Never share it with anyone — it gives full access to your invitation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
