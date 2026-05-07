const PADDLE_SCRIPT_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';

let paddleScriptPromise;

function loadPaddleScript() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (paddleScriptPromise) return paddleScriptPromise;

  paddleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PADDLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Paddle), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Paddle);
    script.onerror = () => reject(new Error('Paddle checkout could not be loaded. Please try again.'));
    document.head.appendChild(script);
  });

  return paddleScriptPromise;
}

export async function getPaddle({ clientToken, environment, onCheckoutCompleted }) {
  const Paddle = await loadPaddleScript();

  window.__velouraPaddleCheckoutCompleted = onCheckoutCompleted;

  if (!window.__velouraPaddleInitialized) {
    if (environment === 'sandbox') {
      Paddle.Environment.set('sandbox');
    }

    Paddle.Initialize({
      token: clientToken,
      eventCallback(event) {
        const completedByName = event?.name === 'checkout.completed';
        const completedByStatus = event?.name === 'checkout.updated'
          && ['completed', 'billed', 'paid'].includes(event?.data?.status);

        if (completedByName || completedByStatus) {
          window.__velouraPaddleCheckoutCompleted?.(event);
        }
      },
    });

    window.__velouraPaddleInitialized = true;
  }

  return Paddle;
}
