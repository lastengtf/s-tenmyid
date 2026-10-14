/**
 * Authentication helper for s.ten.my.id
 * Uses native Web Crypto API (HMAC-SHA256) for secure signed session cookies.
 */

const SESSION_COOKIE_NAME = 's_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Get secret key for HMAC
 */
async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * ArrayBuffer to Base64URL
 */
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL to Uint8Array
 */
function base64UrlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a signed session token
 */
export async function createSessionToken(email, env) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD || 's-ten-my-id-secure-fallback';
  const payload = JSON.stringify({
    email,
    iat: Date.now(),
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  });

  const enc = new TextEncoder();
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const signatureB64 = bufferToBase64Url(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verify a session token
 */
export async function verifySessionToken(token, env) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD || 's-ten-my-id-secure-fallback';

  try {
    const key = await getCryptoKey(secret);
    const enc = new TextEncoder();
    const signatureBytes = base64UrlToBuffer(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (Date.now() > payload.exp) return null;

    // If env.ADMIN_EMAIL is set, make sure it matches
    if (env.ADMIN_EMAIL && payload.email !== env.ADMIN_EMAIL) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Parse cookies from request
 */
export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [k, ...v] = cookie.trim().split('=');
    if (k === name) {
      return decodeURIComponent(v.join('='));
    }
  }
  return null;
}

/**
 * Create Set-Cookie header for session
 */
export function createSessionCookie(token) {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Create Set-Cookie header to clear session
 */
export function createClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * Check if the request is authenticated
 */
export async function authenticateRequest(request, env) {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (!token) return null;
  return await verifySessionToken(token, env);
}

/**
 * Extract admin credentials flexibly from env
 */
export function getAdminCredentials(env) {
  if (!env) return { email: '', password: '' };

  let email = env.ADMIN_EMAIL || env.admin_email || env.EMAIL || env.email || '';
  if (!email) {
    for (const key of Object.keys(env)) {
      if (key.toLowerCase().includes('email')) {
        email = String(env[key]);
        break;
      }
    }
  }

  let password = env.ADMIN_PASSWORD || env.admin_password || env.PASSWORD || env.password || env.ADMIN_PASS || env.admin_pass || '';
  if (!password) {
    for (const key of Object.keys(env)) {
      if (key.toLowerCase().includes('pass')) {
        password = String(env[key]);
        break;
      }
    }
  }

  return {
    email: String(email || '').trim(),
    password: String(password || '').trim()
  };
}

/**
 * Validate admin credentials
 */
export function validateCredentials(email, password, env) {
  const { email: adminEmail, password: adminPassword } = getAdminCredentials(env);

  // If env variables are not configured in Cloudflare Dashboard
  if (!adminEmail || !adminPassword) {
    const presentKeys = Object.keys(env || {}).filter(k => k !== 'DB_KV');
    return {
      valid: false,
      configured: false,
      message: `Variabel belum terbaca di worker aktif (Kunci di runtime: [${presentKeys.join(', ')}]). Silakan klik Deploy/Redeploy di Cloudflare Dashboard agar variabel baru diterapkan.`
    };
  }

  const emailMatch = safeEqual(email.trim().toLowerCase(), adminEmail.toLowerCase());
  const passMatch = safeEqual(password, adminPassword);

  if (emailMatch && passMatch) {
    return { valid: true, configured: true };
  }

  return {
    valid: false,
    configured: true,
    message: 'Email atau password salah.'
  };
}
