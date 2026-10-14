/**
 * Cloudflare Worker: s.ten.my.id
 * Personal URL Shortener & CDN Asset Link Manager
 */

import {
  authenticateRequest,
  validateCredentials,
  resolveAdminCredentials,
  createSessionToken,
  createSessionCookie,
  createClearSessionCookie
} from './auth.js';

import {
  getLink,
  createLink,
  updateLink,
  deleteLink,
  listLinks,
  incrementClicks,
  getCategories
} from './storage.js';

import {
  renderLoginPage,
  renderAdminPage,
  renderNotFoundPage
} from './views.js';

// SVG Favicon
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0284c7"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="bold" font-size="58" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">S</text></svg>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = env.DEFAULT_DOMAIN || url.host || 's.ten.my.id';
    const path = url.pathname;
    const method = request.method.toUpperCase();

    try {
      // 1. Static & Utility routes
      if (path === '/favicon.ico') {
        return new Response(FAVICON_SVG, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      if (path === '/health') {
        const creds = await resolveAdminCredentials(env);
        const safeEnvKeys = Object.keys(env || {}).filter(k => k !== 'DB_KV');
        return Response.json({
          status: 'ok',
          domain,
          detectedEnvKeys: safeEnvKeys,
          adminConfigured: Boolean(creds.email && creds.password),
          adminSource: creds.source,
          time: new Date().toISOString()
        });
      }

      // 2. Authentication API routes
      if (path === '/api/auth/setup' && method === 'POST') {
        const existing = await resolveAdminCredentials(env);
        if (existing.email && existing.password) {
          return Response.json({ success: false, message: 'Akun admin sudah pernah dikonfigurasi.' }, { status: 400 });
        }

        let body;
        try {
          body = await request.json();
        } catch (e) {
          return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
        }

        const { email, password } = body || {};
        if (!email || !password) {
          return Response.json({ success: false, message: 'Email dan password wajib diisi.' }, { status: 400 });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPassword = String(password).trim();
        if (cleanPassword.length < 5) {
          return Response.json({ success: false, message: 'Password minimal 5 karakter.' }, { status: 400 });
        }

        // Store permanently in Cloudflare KV
        if (env && env.DB_KV) {
          await env.DB_KV.put('config:admin', JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
            createdAt: Date.now()
          }));
        }

        const token = await createSessionToken(cleanEmail, env);
        return new Response(JSON.stringify({ success: true, email: cleanEmail }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': createSessionCookie(token)
          }
        });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
        }

        const { email, password } = body || {};
        if (!email || !password) {
          return Response.json({ success: false, message: 'Email dan password wajib diisi.' }, { status: 400 });
        }

        const check = await validateCredentials(email, password, env);
        if (!check.valid) {
          return Response.json({ success: false, message: check.message }, { status: 401 });
        }

        const token = await createSessionToken(email.trim(), env);
        return new Response(JSON.stringify({ success: true, email: email.trim() }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': createSessionCookie(token)
          }
        });
      }

      if (path === '/api/auth/logout' && method === 'POST') {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': createClearSessionCookie()
          }
        });
      }

      // 3. UI Navigation routes
      if (path === '/') {
        const session = await authenticateRequest(request, env);
        if (session) {
          return Response.redirect(`${url.origin}/admin`, 302);
        }
        return Response.redirect(`${url.origin}/login`, 302);
      }

      if (path === '/login') {
        const session = await authenticateRequest(request, env);
        if (session) {
          return Response.redirect(`${url.origin}/admin`, 302);
        }
        const creds = await resolveAdminCredentials(env);
        const isConfigured = Boolean(creds.email && creds.password);
        return new Response(renderLoginPage({ domain, isConfigured }), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      if (path === '/admin') {
        const session = await authenticateRequest(request, env);
        if (!session) {
          return Response.redirect(`${url.origin}/login`, 302);
        }
        return new Response(renderAdminPage({ domain, userEmail: session.email }), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // 4. Protected API Endpoints (Shortlinks CRUD)
      if (path.startsWith('/api/links') || path === '/api/categories') {
        const session = await authenticateRequest(request, env);
        if (!session) {
          return Response.json({ success: false, message: 'Unauthorized. Silakan login kembali.' }, { status: 401 });
        }

        // GET /api/categories
        if (path === '/api/categories' && method === 'GET') {
          const categories = await getCategories(env);
          return Response.json(categories);
        }

        // GET /api/links
        if (path === '/api/links' && method === 'GET') {
          const links = await listLinks(env);
          return Response.json(links);
        }

        // POST /api/links
        if (path === '/api/links' && method === 'POST') {
          let body;
          try {
            body = await request.json();
          } catch (e) {
            return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
          }

          const { url: targetUrl, customSlug, category } = body || {};
          if (!targetUrl) {
            return Response.json({ success: false, message: 'URL tujuan wajib diisi.' }, { status: 400 });
          }

          try {
            const newLink = await createLink(env, {
              url: targetUrl,
              customSlug,
              category
            });
            return Response.json({ success: true, link: newLink }, { status: 201 });
          } catch (err) {
            return Response.json({ success: false, message: err.message }, { status: 400 });
          }
        }

        // PUT /api/links/:slug
        if (path.startsWith('/api/links/') && method === 'PUT') {
          const slug = decodeURIComponent(path.replace('/api/links/', '')).trim();
          let body;
          try {
            body = await request.json();
          } catch (e) {
            return Response.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
          }

          try {
            const updated = await updateLink(env, slug, body || {});
            return Response.json({ success: true, link: updated });
          } catch (err) {
            return Response.json({ success: false, message: err.message }, { status: 400 });
          }
        }

        // DELETE /api/links/:slug
        if (path.startsWith('/api/links/') && method === 'DELETE') {
          const slug = decodeURIComponent(path.replace('/api/links/', '')).trim();
          try {
            const res = await deleteLink(env, slug);
            return Response.json(res);
          } catch (err) {
            return Response.json({ success: false, message: err.message }, { status: 400 });
          }
        }

        return Response.json({ error: 'Endpoint not found' }, { status: 404 });
      }

      // 5. Public Shortlink Redirection: /:slug
      const slugCandidate = path.slice(1).trim();
      if (slugCandidate) {
        const link = await getLink(env, slugCandidate);
        if (link && link.url) {
          // Increment click count asynchronously in background
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(incrementClicks(env, slugCandidate));
          } else {
            incrementClicks(env, slugCandidate).catch(() => {});
          }

          // 302 Redirect to destination
          return new Response(null, {
            status: 302,
            headers: {
              'Location': link.url,
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
      }

      // 6. Not Found Page
      return new Response(renderNotFoundPage({ slug: slugCandidate, domain }), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

    } catch (globalError) {
      console.error('Unhandled worker error:', globalError);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: globalError.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
