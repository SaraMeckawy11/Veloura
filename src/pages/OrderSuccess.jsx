import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/OrderSuccess.css';

const API = import.meta.env.VITE_API_URL || '/api';
const POLL_INTERVAL_MS = 3000;

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;
    let timer;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API}/orders/status/${orderId}`);
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (cancelled) return;

        if (response.ok) {
          setOrder(data);
        }

        if (data.paymentStatus !== 'paid') {
          timer = setTimeout(fetchStatus, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          timer = setTimeout(fetchStatus, POLL_INTERVAL_MS);
        }
      }
    };

    fetchStatus();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const isPaid = order?.paymentStatus === 'paid';
  const invitationUrl = order?.invitationUrl || (order?.publicSlug ? `${window.location.origin}/i/${order.publicSlug}` : '');
  const dashboardUrl = order?.dashboardUrl || (order?.editToken ? `${window.location.origin}/dashboard/${order.editToken}` : '');
  const copyLink = async (value, key) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1600);
  };

  if (!isPaid) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-loading">Verifying payment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>

          <h1>Payment Verified</h1>
          <p className="success-subtitle">
            Congratulations! Your invitation is live now. We also sent these links to your email.
          </p>

          {invitationUrl && (
            <div className="success-links">
              {order.invitationCode && (
                <div className="success-link-card">
                  <span className="link-label">Invitation Code</span>
                  <code>{order.invitationCode}</code>
                  <button type="button" onClick={() => copyLink(order.invitationCode, 'code')}>
                    {copied === 'code' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
              <div className="success-link-card">
                <span className="link-label">Invitation Link (share with guests)</span>
                <code>{invitationUrl}</code>
                <button type="button" onClick={() => copyLink(invitationUrl, 'invitation')}>
                  {copied === 'invitation' ? 'Copied' : 'Copy'}
                </button>
              </div>
              {dashboardUrl && (
                <div className="success-link-card">
                  <span className="link-label">Dashboard & Edit (private - check your email)</span>
                  <code>{dashboardUrl}</code>
                  <button type="button" onClick={() => copyLink(dashboardUrl, 'dashboard')}>
                    {copied === 'dashboard' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="success-actions">
            {order.publicSlug && (
              <Link to={`/i/${order.publicSlug}`} className="btn btn-gold">
                View Invitation
              </Link>
            )}
            {order.editToken && (
              <Link to={`/dashboard/${order.editToken}`} className="btn btn-gold">
                Go to Dashboard
              </Link>
            )}
            <Link to="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
