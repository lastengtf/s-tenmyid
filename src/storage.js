/**
 * Cloudflare KV Storage helper for s.ten.my.id
 * Binding: DB_KV
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

/**
 * Generate random alphanumeric slug of given length
 */
export function generateRandomSlug(length = 6) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // human-friendly lowercase alphanumeric
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
  if (!env.DB_KV) throw new Error('DB_KV binding is missing');
  const key = `link:${slug.toLowerCase()}`;
  return await env.DB_KV.get(key, 'json');
}

/**
 * Create a new shortlink
 */
export async function createLink(env, { url, customSlug, category }) {
  if (!env.DB_KV) throw new Error('DB_KV binding is missing');
  
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
    // Check if exists
    const existing = await env.DB_KV.get(`link:${finalSlug}`, 'json');
    if (existing) {
      throw new Error(`Slug "${finalSlug}" sudah digunakan. Silakan gunakan slug lain.`);
    }
  } else {
    // Generate unique random slug
    let attempts = 0;
    while (attempts < 10) {
      const candidate = generateRandomSlug(6);
      if (!RESERVED_SLUGS.has(candidate)) {
        const existing = await env.DB_KV.get(`link:${candidate}`, 'json');
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
  await env.DB_KV.put(key, JSON.stringify(linkData), {
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
  if (!env.DB_KV) throw new Error('DB_KV binding is missing');
  const cleanSlug = slug.toLowerCase();
  const key = `link:${cleanSlug}`;
  const existing = await env.DB_KV.get(key, 'json');

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

  await env.DB_KV.put(key, JSON.stringify(updatedData), {
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
  if (!env.DB_KV) throw new Error('DB_KV binding is missing');
  const cleanSlug = slug.toLowerCase();
  const key = `link:${cleanSlug}`;
  await env.DB_KV.delete(key);
  return { success: true, slug: cleanSlug };
}

/**
 * List all shortlinks with metadata
 */
export async function listLinks(env) {
  if (!env.DB_KV) throw new Error('DB_KV binding is missing');
  
  const listResult = await env.DB_KV.list({ prefix: 'link:', limit: 1000 });
  const links = [];

  for (const item of listResult.keys) {
    if (item.metadata && item.metadata.url) {
      links.push(item.metadata);
    } else {
      // Fallback: fetch JSON if metadata is missing
      const data = await env.DB_KV.get(item.name, 'json');
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

  // Sort descending by creation date
  links.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return links;
}

/**
 * Asynchronously increment click count
 */
export async function incrementClicks(env, slug) {
  if (!env.DB_KV) return;
  try {
    const cleanSlug = slug.toLowerCase();
    const key = `link:${cleanSlug}`;
    const data = await env.DB_KV.get(key, 'json');
    if (!data) return;

    data.clicks = (data.clicks || 0) + 1;
    data.lastClickedAt = Date.now();

    await env.DB_KV.put(key, JSON.stringify(data), {
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
