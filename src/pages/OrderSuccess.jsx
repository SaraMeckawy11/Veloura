import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/OrderSuccess.css';

const API = import.meta.env.VITE_API_URL || '/api';
// Poll every 3s for up to ~2min while we wait for the Paddle webhook to mark the order paid.
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    let cancelled = false;
    let attempts = 0;
    let timer;

    const fetchStatus = async () => {
      try {
        const r = await fetch(`${API}/orders/status/${orderId}`);
        const data = await r.json();
        if (cancelled) return;
        setOrder(data);
        setLoading(false);

        if (data.paymentStatus === 'paid') return; // done

        attempts += 1;
        if (attempts >= POLL_MAX_ATTEMPTS) {
          setPollingTimedOut(true);
          return;
        }
        timer = setTimeout(fetchStatus, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setLoading(false);
        attempts += 1;
        if (attempts < POLL_MAX_ATTEMPTS) {
          timer = setTimeout(fetchStatus, POLL_INTERVAL_MS);
        } else {
          setPollingTimedOut(true);
        }
      }
    };

    fetchStatus();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-loading">Verifying payment...</div>
        </div>
      </div>
    );
  }

  const isPaid = order?.paymentStatus === 'paid';

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card">
          <div className={`success-icon ${isPaid ? 'success' : 'pending'}`}>
            {isPaid ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            )}
          </div>

          <h1>{isPaid ? 'Your Invitation is Live!' : 'Payment Processing'}</h1>
          <p className="success-subtitle">
            {isPaid
              ? "Congratulations! A confirmation email with your invitation link and private edit link is on its way."
              : pollingTimedOut
                ? "Your payment is taking longer than usual to confirm. You'll get an email as soon as it lands — feel free to close this page."
                : "Your payment is being confirmed — this usually takes a few seconds."
            }
          </p>

          {isPaid && order.publicSlug && (
            <div className="success-links">
              <div className="success-link-card">
                <span className="link-label">Invitation Link (share with guests)</span>
                <code>{window.location.origin}/i/{order.publicSlug}</code>
              </div>
              {order.editToken && (
                <div className="success-link-card">
                  <span className="link-label">Dashboard & Edit (private — check your email)</span>
                  <code>{window.location.origin}/dashboard/{order.editToken}</code>
                </div>
              )}
            </div>
          )}

          <div className="success-actions">
            {isPaid && order.editToken && (
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
