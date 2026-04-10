import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import registry from '../invitations/registry';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Invitation router — fetches the order, determines the template slug,
 * and renders the matching themed invitation from the registry.
 */
export default function Invitation({ demo = false, templateSlug: demoSlug }) {
  const { publicSlug } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templateSlug, setTemplateSlug] = useState(demoSlug || null);

  useEffect(() => {
    if (demo && demoSlug) {
      const entry = registry[demoSlug];
      if (!entry) {
        setError(`Template "${demoSlug}" not found`);
        setLoading(false);
        return;
      }
      entry.demoData().then(data => {
        setOrder(data);
        setTemplateSlug(demoSlug);
        setLoading(false);
      });
      return;
    }
    fetch(`${API}/orders/invite/${publicSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else {
          setOrder(data);
          setTemplateSlug(data.template?.slug || 'boarding-pass');
        }
        setLoading(false);
      })
      .catch(() => { setError('Invitation not found'); setLoading(false); });
  }, [publicSlug, demo, demoSlug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf8f4', fontFamily: "'Cormorant Garamond', serif" }}>
        <div style={{ width: 40, height: 40, border: '3px solid #d4c9b8', borderTopColor: '#b8965a', borderRadius: '50%', animation: 'inv-spin 1s linear infinite', marginBottom: 16 }} />
        <p>Loading your invitation...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf8f4', fontFamily: "'Cormorant Garamond', serif", textAlign: 'center', padding: 40 }}>
        <h2>Invitation Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  const entry = registry[templateSlug];
  if (!entry) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf8f4', fontFamily: "'Cormorant Garamond', serif", textAlign: 'center', padding: 40 }}>
        <h2>Template Not Available</h2>
        <p>The invitation template &ldquo;{templateSlug}&rdquo; is not yet available.</p>
      </div>
    );
  }

  const TemplateComponent = entry.component;

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif" }}>Loading...</p>
      </div>
    }>
      <TemplateComponent order={order} demo={demo} publicSlug={publicSlug} />
    </Suspense>
  );
}
