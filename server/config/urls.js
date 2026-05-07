function stripEnvKeyPrefix(value) {
  return value.replace(/^[A-Z_][A-Z0-9_]*=/i, '');
}

export function normalizePublicUrl(value, fallback = 'http://localhost:5173') {
  const raw = stripEnvKeyPrefix(String(value || fallback))
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
}

export function getClientUrl() {
  return normalizePublicUrl(
    process.env.FRONTEND_URL || process.env.CLIENT_URL,
    'http://localhost:5173'
  );
}
