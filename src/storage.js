/**
 * Cloudflare KV Storage helper for s.ten.my.id
 * Binding: DB_KV with local fallback for offline/development environments
 */

const RESERVED_SLUGS = new Set([
  'login',
  'logout',
  'admin',
  'api',
  'favicon.ico',
  'robots.txt',
  'health',
  'static',
  'assets',
  'public'
]);

// In-memory fallback for local development when Wrangler is not authenticated to remote KV
const localKVStore = new Map();

function isRemoteKvError(err) {
  if (!err) return false;
  return err.remote === true ||
         String(err.message || '').includes('internal error') ||
         String(err.message || '').includes('Network connection') ||
         String(err.message || '').includes('Failed to fetch');
}

/**
 * Resilient KV Get
 */
async function kvGet(env, key, type = 'text') {
  if (env && env.DB_KV) {
    try {
      const res = await env.DB_KV.get(key, type);
      if (res !== undefined) return res;
    } catch (err) {
      if (!isRemoteKvError(err)) throw err;
    }
  }

  // Local fallback
  const item = localKVStore.get(key);
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

/**
 * Resilient KV Put
 */
async function kvPut(env, key, value, options = {}) {
  let putSuccess = false;
  if (env && env.DB_KV) {
    try {
      await env.DB_KV.put(key, value, options);
      putSuccess = true;
    } catch (err) {
      if (!isRemoteKvError(err)) throw err;
    }
  }

  // Keep local store in sync
  localKVStore.set(key, {
    value: String(value),
    metadata: options.metadata || null
  });

  return putSuccess;
}

/**
 * Resilient KV Delete
 */
async function kvDelete(env, key) {
  if (env && env.DB_KV) {
    try {
      await env.DB_KV.delete(key);
    } catch (err) {
      if (!isRemoteKvError(err)) throw err;
    }
  }
  localKVStore.delete(key);
}

/**
 * Resilient KV List
 */
async function kvList(env, options = {}) {
  const prefix = options.prefix || '';
  if (env && env.DB_KV) {
    try {
      const res = await env.DB_KV.list(options);
      if (res && Array.isArray(res.keys)) return res;
    } catch (err) {
      if (!isRemoteKvError(err)) throw err;
    }
  }

  // Local fallback list
  const keys = [];
  for (const [key, data] of localKVStore.entries()) {
    if (key.startsWith(prefix)) {
      keys.push({
        name: key,
        metadata: data.metadata
      });
    }
  }
  return { keys, list_complete: true };
}

/**
 * Generate random alphanumeric slug of given length
 */
export function generateRandomSlug(length = 6) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Check if slug is valid
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  if (trimmed.length < 2 || trimmed.length > 64) return false;
  if (RESERVED_SLUGS.has(trimmed.toLowerCase())) return false;
  return /^[a-zA-Z0-9-_]+$/.test(trimmed);
}

/**
 * Normalize and validate URL
 */
export function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Get single link by slug
 */
export async function getLink(env, slug) {
  const key = `link:${slug.toLowerCase()}`;
  return await kvGet(env, key, 'json');
}

/**
 * Create a new shortlink
 */
export async function createLink(env, { url, customSlug, category }) {
  const cleanUrl = url.trim();
  if (!isValidUrl(cleanUrl)) {
    throw new Error('URL tujuan tidak valid. Harus diawali dengan http:// atau https://');
  }

  let finalSlug = '';
  if (customSlug && customSlug.trim()) {
    finalSlug = customSlug.trim().toLowerCase();
    if (!isValidSlug(finalSlug)) {
      throw new Error(`Custom slug "${customSlug}" tidak valid atau merupakan nama sistem yang dilindungi.`);
    }
    const existing = await kvGet(env, `link:${finalSlug}`, 'json');
    if (existing) {
      throw new Error(`Slug "${finalSlug}" sudah digunakan. Silakan gunakan slug lain.`);
    }
  } else {
    let attempts = 0;
    while (attempts < 10) {
      const candidate = generateRandomSlug(6);
      if (!RESERVED_SLUGS.has(candidate)) {
        const existing = await kvGet(env, `link:${candidate}`, 'json');
        if (!existing) {
          finalSlug = candidate;
          break;
        }
      }
      attempts++;
    }
    if (!finalSlug) {
      throw new Error('Gagal membuat slug acak yang unik, silakan coba lagi.');
    }
  }

  const cleanCategory = (category || 'Umum').trim() || 'Umum';
  const now = Date.now();

  const linkData = {
    slug: finalSlug,
    url: cleanUrl,
    category: cleanCategory,
    createdAt: now,
    updatedAt: now,
    clicks: 0
  };

  const key = `link:${finalSlug}`;
  await kvPut(env, key, JSON.stringify(linkData), {
    metadata: {
      slug: finalSlug,
      url: cleanUrl,
      category: cleanCategory,
      createdAt: now,
      clicks: 0
    }
  });

  return linkData;
}

/**
 * Update an existing shortlink
 */
export async function updateLink(env, slug, { url, category }) {
  const cleanSlug = slug.toLowerCase();
  const key = `link:${cleanSlug}`;
  const existing = await kvGet(env, key, 'json');

  if (!existing) {
    throw new Error(`Shortlink "${slug}" tidak ditemukan.`);
  }

  let newUrl = existing.url;
  if (url && url.trim()) {
    const cleanUrl = url.trim();
    if (!isValidUrl(cleanUrl)) {
      throw new Error('URL tujuan tidak valid.');
    }
    newUrl = cleanUrl;
  }

  const newCategory = category !== undefined ? (category.trim() || 'Umum') : existing.category;
  const now = Date.now();

  const updatedData = {
    ...existing,
    url: newUrl,
    category: newCategory,
    updatedAt: now
  };

  await kvPut(env, key, JSON.stringify(updatedData), {
    metadata: {
      slug: cleanSlug,
      url: newUrl,
      category: newCategory,
      createdAt: existing.createdAt || now,
      clicks: existing.clicks || 0
    }
  });

  return updatedData;
}

/**
 * Delete a shortlink
 */
export async function deleteLink(env, slug) {
  const cleanSlug = slug.toLowerCase();
  const key = `link:${cleanSlug}`;
  await kvDelete(env, key);
  return { success: true, slug: cleanSlug };
}

/**
 * List all shortlinks with metadata
 */
export async function listLinks(env) {
  const listResult = await kvList(env, { prefix: 'link:', limit: 1000 });
  const links = [];

  for (const item of listResult.keys) {
    if (item.metadata && item.metadata.url) {
      links.push(item.metadata);
    } else {
      const data = await kvGet(env, item.name, 'json');
      if (data) {
        links.push({
          slug: data.slug,
          url: data.url,
          category: data.category || 'Umum',
          createdAt: data.createdAt || 0,
          clicks: data.clicks || 0
        });
      }
    }
  }

  links.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return links;
}

/**
 * Asynchronously increment click count
 */
export async function incrementClicks(env, slug) {
  try {
    const cleanSlug = slug.toLowerCase();
    const key = `link:${cleanSlug}`;
    const data = await kvGet(env, key, 'json');
    if (!data) return;

    data.clicks = (data.clicks || 0) + 1;
    data.lastClickedAt = Date.now();

    await kvPut(env, key, JSON.stringify(data), {
      metadata: {
        slug: cleanSlug,
        url: data.url,
        category: data.category || 'Umum',
        createdAt: data.createdAt,
        clicks: data.clicks
      }
    });
  } catch (err) {
    console.error('Error incrementing click:', err);
  }
}

/**
 * Get distinct list of categories with counts
 */
export async function getCategories(env) {
  const links = await listLinks(env);
  const catMap = {};
  for (const link of links) {
    const cat = link.category || 'Umum';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }
  return catMap;
}
