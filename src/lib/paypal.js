// Loads the PayPal JS SDK exactly once per page load. The same SDK URL handles
// both sandbox and live — sandbox vs live is determined by the Client ID itself,
// since each Client ID is tied to a specific PayPal environment.
let paypalScriptPromise;
let loadedClientId = null;

export function getPaypal({ clientId, currency = 'USD' }) {
  if (!clientId) {
    return Promise.reject(new Error('PayPal client id is missing.'));
  }

  // If a previous load used a different client id, we cannot swap mid-session —
  // the SDK locks to whichever client id loaded first. Surface a clear error.
  if (loadedClientId && loadedClientId !== clientId) {
    return Promise.reject(new Error('PayPal SDK already initialised with a different client id. Reload the page to switch.'));
  }

  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalScriptPromise) return paypalScriptPromise;

  const params = new URLSearchParams({
    'client-id': clientId,
    currency,
    intent: 'capture',
    components: 'buttons',
  });
  const src = `https://www.paypal.com/sdk/js?${params.toString()}`;

  paypalScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-veloura-paypal]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.velouraPaypal = '1';
    script.onload = () => {
      loadedClientId = clientId;
      resolve(window.paypal);
    };
    script.onerror = () => reject(new Error('PayPal checkout could not be loaded. Please try again.'));
    document.head.appendChild(script);
  });

  return paypalScriptPromise;
}
