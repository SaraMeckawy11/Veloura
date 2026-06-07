// Loads the PayPal JS SDK exactly once per page load. The same SDK URL handles
// both sandbox and live; each Client ID is tied to a specific PayPal environment.
let paypalScriptPromise;
let loadedClientId = null;
let loadedCurrency = null;
let loadedComponents = null;

function normalizeComponents(components = 'buttons') {
  return components
    .split(',')
    .map(component => component.trim())
    .filter(Boolean)
    .sort()
    .join(',');
}

export function getPaypal({ clientId, currency = 'USD', components = 'buttons' }) {
  if (!clientId) {
    return Promise.reject(new Error('PayPal client id is missing.'));
  }

  const requestedComponents = normalizeComponents(components);

  // The SDK locks to the first client/currency/component set loaded on a page.
  if (loadedClientId && loadedClientId !== clientId) {
    return Promise.reject(new Error('PayPal SDK already initialised with a different client id. Reload the page to switch.'));
  }
  if (loadedCurrency && loadedCurrency !== currency) {
    return Promise.reject(new Error('PayPal SDK already initialised with a different currency. Reload the page to switch.'));
  }
  if (loadedComponents && loadedComponents !== requestedComponents) {
    return Promise.reject(new Error('PayPal SDK already initialised without the requested checkout components. Reload the page to switch.'));
  }

  if (window.paypal) return Promise.resolve(window.paypal);
  if (paypalScriptPromise) return paypalScriptPromise;

  const params = new URLSearchParams({
    'client-id': clientId,
    currency,
    intent: 'capture',
    components: requestedComponents,
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
      loadedCurrency = currency;
      loadedComponents = requestedComponents;
      resolve(window.paypal);
    };
    script.onerror = () => reject(new Error('PayPal checkout could not be loaded. Please try again.'));
    document.head.appendChild(script);
  });

  return paypalScriptPromise;
}
