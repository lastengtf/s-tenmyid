import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import {
  createSessionToken,
  verifySessionToken,
  validateCredentials,
  createSessionCookie,
  getCookie
} from '../src/auth.js';
import {
  generateRandomSlug,
  isValidSlug,
  isValidUrl,
  createLink,
  getLink,
  listLinks,
  deleteLink,
  updateLink
} from '../src/storage.js';

// Mock Cloudflare KV Namespace in-memory
class MockKV {
  constructor() {
    this.store = new Map();
  }

  async get(key, type = 'text') {
    const item = this.store.get(key);
    if (!item) return null;
    if (type === 'json') {
      try {
        return JSON.parse(item.value);
      } catch (e) {
        return null;
      }
    }
    return item.value;
  }

  async put(key, value, options = {}) {
    this.store.set(key, {
      value: String(value),
      metadata: options.metadata || null
    });
  }

  async delete(key) {
    this.store.delete(key);
  }

  async list(options = {}) {
    const prefix = options.prefix || '';
    const keys = [];
    for (const [key, data] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        keys.push({
          name: key,
          metadata: data.metadata
        });
      }
    }
    return { keys, list_complete: true };
  }
}

const mockEnv = {
  ADMIN_EMAIL: 'admin@ten.my.id',
  ADMIN_PASSWORD: 'test-secret-password',
  SESSION_SECRET: 'super-secure-test-key-1234567890',
  DEFAULT_DOMAIN: 's.ten.my.id',
  DB_KV: new MockKV()
};

test('Slug & URL Validation', () => {
  assert.equal(isValidSlug('valid-slug_123'), true);
  assert.equal(isValidSlug('a'), false); // too short
  assert.equal(isValidSlug('admin'), false); // reserved
  assert.equal(isValidSlug('login'), false); // reserved
  assert.equal(isValidSlug('has space'), false);

  assert.equal(isValidUrl('https://ten.my.id/portfolio'), true);
  assert.equal(isValidUrl('http://example.com/asset.png'), true);
  assert.equal(isValidUrl('not-a-url'), false);
  assert.equal(isValidUrl('javascript:alert(1)'), false);

  const rand = generateRandomSlug(6);
  assert.equal(rand.length, 6);
  assert.equal(isValidSlug(rand), true);
});

test('Auth: Credentials and Sessions', async () => {
  // Validate credentials
  const valid = await validateCredentials('admin@ten.my.id', 'test-secret-password', mockEnv);
  assert.equal(valid.valid, true);

  const invalidPass = await validateCredentials('admin@ten.my.id', 'wrong-pass', mockEnv);
  assert.equal(invalidPass.valid, false);

  const invalidEmail = await validateCredentials('other@ten.my.id', 'test-secret-password', mockEnv);
  assert.equal(invalidEmail.valid, false);

  // Token creation & verification
  const token = await createSessionToken('admin@ten.my.id', mockEnv);
  assert.ok(token);

  const verified = await verifySessionToken(token, mockEnv);
  assert.ok(verified);
  assert.equal(verified.email, 'admin@ten.my.id');

  // Tampered token fails
  const tampered = token.slice(0, -4) + 'abcd';
  const badVerified = await verifySessionToken(tampered, mockEnv);
  assert.equal(badVerified, null);

  // Cookie formatting & parsing
  const cookieHeader = createSessionCookie(token);
  const mockReq = new Request('https://s.ten.my.id/admin', {
    headers: { Cookie: cookieHeader }
  });
  const parsedCookie = getCookie(mockReq, 's_session');
  assert.equal(parsedCookie, token);
});

test('Storage: CRUD on KV', async () => {
  const kv = new MockKV();
  const env = { ...mockEnv, DB_KV: kv };

  // Create link with custom slug
  const created = await createLink(env, {
    url: 'https://github.com/lastengtf',
    customSlug: 'github',
    category: 'Social'
  });
  assert.equal(created.slug, 'github');
  assert.equal(created.category, 'Social');

  // Duplicate custom slug must fail
  await assert.rejects(
    () => createLink(env, { url: 'https://example.com', customSlug: 'github' }),
    /sudah digunakan/
  );

  // Fetch link
  const link = await getLink(env, 'github');
  assert.ok(link);
  assert.equal(link.url, 'https://github.com/lastengtf');

  // List links
  const links = await listLinks(env);
  assert.equal(links.length, 1);
  assert.equal(links[0].slug, 'github');

  // Update link
  const updated = await updateLink(env, 'github', {
    url: 'https://github.com/lastengtf/s-tenmyid',
    category: 'Repository'
  });
  assert.equal(updated.url, 'https://github.com/lastengtf/s-tenmyid');
  assert.equal(updated.category, 'Repository');

  // Delete link
  await deleteLink(env, 'github');
  const deleted = await getLink(env, 'github');
  assert.equal(deleted, null);
});

test('Worker Fetch: Route Handling & Redirects', async () => {
  const kv = new MockKV();
  const env = { ...mockEnv, DB_KV: kv };

  // 1. Health check
  const healthRes = await worker.fetch(new Request('https://s.ten.my.id/health'), env);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.status, 'ok');

  // 2. Favicon
  const favRes = await worker.fetch(new Request('https://s.ten.my.id/favicon.ico'), env);
  assert.equal(favRes.status, 200);
  assert.equal(favRes.headers.get('Content-Type'), 'image/svg+xml');

  // 3. Unauthenticated / -> 302 to /login
  const rootRes = await worker.fetch(new Request('https://s.ten.my.id/'), env);
  assert.equal(rootRes.status, 302);
  assert.ok(rootRes.headers.get('Location').includes('/login'));

  // 4. Login API failure
  const badLogin = await worker.fetch(new Request('https://s.ten.my.id/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'wrong@ten.my.id', password: 'bad' })
  }), env);
  assert.equal(badLogin.status, 401);

  // 5. Login API success
  const goodLogin = await worker.fetch(new Request('https://s.ten.my.id/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ten.my.id', password: 'test-secret-password' })
  }), env);
  assert.equal(goodLogin.status, 200);
  const setCookie = goodLogin.headers.get('Set-Cookie');
  assert.ok(setCookie.includes('s_session='));

  // 6. Create link via API (with auth cookie)
  const authCookie = setCookie.split(';')[0];
  const createRes = await worker.fetch(new Request('https://s.ten.my.id/api/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie
    },
    body: JSON.stringify({
      url: 'https://example.com/asset.pdf',
      customSlug: 'my-doc',
      category: 'Dokumen'
    })
  }), env);
  assert.equal(createRes.status, 201);

  // 7. Test Public Shortlink Redirect
  const redirectRes = await worker.fetch(new Request('https://s.ten.my.id/my-doc'), env);
  assert.equal(redirectRes.status, 302);
  assert.equal(redirectRes.headers.get('Location'), 'https://example.com/asset.pdf');

  // 8. Test 404 for unknown slug
  const notFoundRes = await worker.fetch(new Request('https://s.ten.my.id/unknown-xyz'), env);
  assert.equal(notFoundRes.status, 404);
  const notFoundHtml = await notFoundRes.text();
  assert.ok(notFoundHtml.includes('Tautan Tidak Ditemukan'));

  // 9. Test First-time Admin Setup via KV
  const freshKV = new MockKV();
  const emptyEnv = { DB_KV: freshKV };
  const setupRes = await worker.fetch(new Request('https://s.ten.my.id/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@ten.my.id', password: 'secure-owner-pass' })
  }), emptyEnv);
  assert.equal(setupRes.status, 200);
  const setupCookie = setupRes.headers.get('Set-Cookie');
  assert.ok(setupCookie.includes('s_session='));

  // Duplicate setup must be rejected
  const dupSetup = await worker.fetch(new Request('https://s.ten.my.id/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hacker@ten.my.id', password: 'hack' })
  }), emptyEnv);
  assert.equal(dupSetup.status, 400);
});
