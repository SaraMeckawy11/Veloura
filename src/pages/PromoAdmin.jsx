import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PromoAdmin.css';

const API = import.meta.env.VITE_API_URL || '/api';
const EMPTY_FORM = {
  code: '',
  discountPercent: 10,
  maxUses: 1,
  active: true,
  expiresAt: '',
};

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function PromoAdmin() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('velouraPromoAdminKey') || '');
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingCode, setEditingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);

  const loadPromos = async (key = adminKey) => {
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/promos/admin`, {
        cache: 'no-store',
        headers: { 'x-promo-admin-key': key.trim() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load promo codes.');
      sessionStorage.setItem('velouraPromoAdminKey', key.trim());
      setPromos(data.promos || []);
      setConnected(true);
    } catch (requestError) {
      setConnected(false);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadPromos(adminKey);
    // Reconnect once from the key saved for this browser session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    setEditingCode('');
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
  };

  const startEdit = promo => {
    setEditingCode(promo.code);
    setForm({
      code: promo.code,
      discountPercent: promo.discountPercent,
      maxUses: promo.maxUses,
      active: promo.active,
      expiresAt: toLocalDateTime(promo.expiresAt),
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePromo = async event => {
    event.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API}/promos/admin/${encodeURIComponent(editingCode || form.code.trim())}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-promo-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({
          displayCode: form.code.trim(),
          discountPercent: Number(form.discountPercent),
          maxUses: Number(form.maxUses),
          active: form.active,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this promo code.');
      setNotice(`${data.promo.code} saved. ${data.promo.remaining} use${data.promo.remaining === 1 ? '' : 's'} remaining.`);
      setEditingCode(data.promo.code);
      await loadPromos(adminKey);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const disconnect = () => {
    sessionStorage.removeItem('velouraPromoAdminKey');
    setAdminKey('');
    setPromos([]);
    setConnected(false);
    setNotice('');
    setError('');
  };

  return (
    <main className="promo-admin-page">
      <header className="promo-admin-header">
        <Link to="/" className="promo-admin-brand">Veloura</Link>
        <Link to="/" className="promo-admin-back">Back to website</Link>
      </header>

      <div className="promo-admin-shell">
        <section className="promo-admin-intro">
          <span>Private tools</span>
          <h1>Promo codes</h1>
          <p>Create discounts, control their lifetime use limits, and see exactly how many orders used each code.</p>
        </section>

        <section className="promo-admin-key-card" aria-labelledby="admin-key-title">
          <div>
            <h2 id="admin-key-title">Admin access</h2>
            <p>Use the same <code>PROMO_ADMIN_KEY</code> configured on the server.</p>
          </div>
          <div className="promo-admin-key-row">
            <label>
              <span>Admin key</span>
              <input
                type="password"
                value={adminKey}
                onChange={event => setAdminKey(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your private key"
              />
            </label>
            <button type="button" className="promo-admin-primary" onClick={() => loadPromos()} disabled={!adminKey.trim() || loading}>
              {loading ? 'Connecting…' : connected ? 'Refresh' : 'Connect'}
            </button>
            {connected && <button type="button" className="promo-admin-secondary" onClick={disconnect}>Disconnect</button>}
          </div>
        </section>

        {error && <p className="promo-admin-message promo-admin-message--error" role="alert">{error}</p>}
        {notice && <p className="promo-admin-message promo-admin-message--success" role="status">{notice}</p>}

        {connected && (
          <div className="promo-admin-grid">
            <section className="promo-admin-editor">
              <div className="promo-admin-section-heading">
                <div>
                  <span>{editingCode ? 'Edit code' : 'New code'}</span>
                  <h2>{editingCode || 'Create a promo'}</h2>
                </div>
                {editingCode && <button type="button" onClick={startCreate}>New code</button>}
              </div>

              <form onSubmit={savePromo}>
                <label>
                  <span>Code name</span>
                  <input
                    value={form.code}
                    onChange={event => setForm(current => ({ ...current, code: event.target.value }))}
                    placeholder="e.g. Summer"
                    disabled={Boolean(editingCode)}
                    required
                  />
                </label>
                <div className="promo-admin-form-row">
                  <label>
                    <span>Discount %</span>
                    <input type="number" min="0" max="100" step="1" value={form.discountPercent} onChange={event => setForm(current => ({ ...current, discountPercent: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Total use limit</span>
                    <input type="number" min="1" step="1" value={form.maxUses} onChange={event => setForm(current => ({ ...current, maxUses: event.target.value }))} required />
                  </label>
                </div>
                <label>
                  <span>Expiry (optional)</span>
                  <input type="datetime-local" value={form.expiresAt} onChange={event => setForm(current => ({ ...current, expiresAt: event.target.value }))} />
                </label>
                <label className="promo-admin-check">
                  <input type="checkbox" checked={form.active} onChange={event => setForm(current => ({ ...current, active: event.target.checked }))} />
                  <span>Code is active</span>
                </label>
                <p className="promo-admin-help">Increasing the total limit grants more uses without deleting the existing history.</p>
                <button className="promo-admin-primary promo-admin-save" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingCode ? 'Save changes' : 'Create code'}
                </button>
              </form>
            </section>

            <section className="promo-admin-list">
              <div className="promo-admin-section-heading">
                <div>
                  <span>Usage</span>
                  <h2>All codes</h2>
                </div>
                <strong>{promos.length}</strong>
              </div>

              <div className="promo-admin-code-list">
                {promos.map(promo => {
                  const expired = promo.expiresAt && new Date(promo.expiresAt) <= new Date();
                  return (
                    <article key={promo.code} className="promo-admin-code-card">
                      <div className="promo-admin-code-top">
                        <div>
                          <h3>{promo.code}</h3>
                          <p>{promo.discountPercent}% discount</p>
                        </div>
                        <span className={`promo-admin-status${promo.active && !expired ? ' is-active' : ''}`}>
                          {expired ? 'Expired' : promo.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <dl className="promo-admin-stats">
                        <div><dt>Used</dt><dd>{promo.used}</dd></div>
                        <div><dt>Reserved</dt><dd>{promo.reserved}</dd></div>
                        <div><dt>Remaining</dt><dd>{promo.remaining}</dd></div>
                        <div><dt>Limit</dt><dd>{promo.maxUses}</dd></div>
                      </dl>
                      <div className="promo-admin-code-bottom">
                        <span>{promo.expiresAt ? `Expires ${new Date(promo.expiresAt).toLocaleString()}` : 'No expiry date'}</span>
                        <button type="button" onClick={() => startEdit(promo)}>Edit</button>
                      </div>
                    </article>
                  );
                })}
                {!promos.length && <p className="promo-admin-empty">No promo codes yet.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
