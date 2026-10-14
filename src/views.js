/**
 * Clean, modern, distraction-free HTML Views for s.ten.my.id
 * Pure Vanilla CSS & JS, no external framework dependencies.
 */

const BASE_STYLES = `
  :root {
    --bg-page: #0a0e17;
    --bg-surface: #111827;
    --bg-surface-hover: #172033;
    --bg-input: #0d131f;
    --border-color: #1f293d;
    --border-focus: #38bdf8;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --accent: #38bdf8;
    --accent-hover: #0284c7;
    --accent-glow: rgba(56, 189, 248, 0.15);
    --badge-bg: #1e293b;
    --badge-text: #38bdf8;
    --danger: #f87171;
    --danger-bg: rgba(248, 113, 113, 0.1);
    --success: #34d399;
    --success-bg: rgba(52, 211, 153, 0.1);
    --warning: #fbbf24;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg-page);
    color: var(--text-main);
    font-family: var(--font);
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  input, button, select {
    font-family: inherit;
    font-size: 0.95rem;
  }

  button {
    cursor: pointer;
    transition: all 0.15s ease;
  }

  /* Toast Notification */
  #toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    background: #1e293b;
    color: #fff;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: toast-in 0.2s ease forwards;
    pointer-events: auto;
  }
  .toast.success { border-color: var(--success); }
  .toast.error { border-color: var(--danger); }
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

/**
 * Render Login Page
 */
export function renderLoginPage({ error = '', domain = 's.ten.my.id', isConfigured = true }) {
  const isSetup = !isConfigured;
  const title = isSetup ? 'Inisialisasi Admin' : 'Login';
  const subtitle = isSetup ? 'Buat akun admin (disimpan permanen di Cloudflare KV)' : 'Personal URL Shortener';
  const btnText = isSetup ? 'Simpan & Masuk' : 'Masuk';
  const apiUrl = isSetup ? '/api/auth/setup' : '/api/auth/login';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${domain}</title>
  <style>
    ${BASE_STYLES}
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      width: 100%;
      max-width: 400px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 32px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #0284c7, #6366f1);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: #fff;
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .setup-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .form-group {
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .input-field {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .input-field:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .btn-submit {
      width: 100%;
      background: var(--accent);
      color: #0b1120;
      font-weight: 600;
      border: none;
      padding: 11px;
      border-radius: var(--radius-sm);
      margin-top: 8px;
    }
    .btn-submit:hover {
      background: var(--accent-hover);
      color: #ffffff;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert-error {
      background: var(--danger-bg);
      border: 1px solid var(--danger);
      color: #fca5a5;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 18px;
      display: ${error ? 'block' : 'none'};
    }
    .footer-note {
      text-align: center;
      margin-top: 24px;
      font-size: 0.75rem;
      color: var(--text-dim);
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="brand">
      <div class="brand-logo">S</div>
      <div>
        <div class="brand-title">${domain}</div>
        <div class="brand-sub">${subtitle}</div>
      </div>
    </div>

    ${isSetup ? '<div class="setup-badge">⭐ Inisialisasi Akun Admin</div>' : ''}
    <div id="error-box" class="alert-error">${error}</div>

    <form id="auth-form">
      <div class="form-group">
        <label for="email">Email Admin</label>
        <input type="email" id="email" name="email" class="input-field" required placeholder="admin@domain.com" autofocus autocomplete="username">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" class="input-field" required placeholder="••••••••" autocomplete="${isSetup ? 'new-password' : 'current-password'}">
      </div>
      <button type="submit" id="btn-submit" class="btn-submit">${btnText}</button>
    </form>

    <div class="footer-note">
      ${isSetup ? 'Kredensial disimpan permanen di Cloudflare KV' : 'Sistem autentikasi Cloudflare KV & Secrets'}
    </div>
  </div>

  <script>
    const form = document.getElementById('auth-form');
    const btn = document.getElementById('btn-submit');
    const errorBox = document.getElementById('error-box');
    const API_URL = '${apiUrl}';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Memproses...';

      try {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          window.location.href = '/admin';
        } else {
          errorBox.textContent = data.message || 'Gagal memproses. Periksa kembali input Anda.';
          errorBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = '${btnText}';
        }
      } catch (err) {
        errorBox.textContent = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
        errorBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = '${btnText}';
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Render Admin Dashboard Page
 */
export function renderAdminPage({ domain = 's.ten.my.id', userEmail = '' }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - ${domain}</title>
  <style>
    ${BASE_STYLES}

    /* Navbar */
    .navbar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .brand-badge {
      background: linear-gradient(135deg, #0284c7, #6366f1);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: #fff;
    }
    .brand-name {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-pill {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      border-radius: 20px;
      color: var(--text-muted);
      font-size: 0.82rem;
    }
    .btn-logout {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
    }
    .btn-logout:hover {
      background: var(--bg-input);
      color: var(--danger);
      border-color: var(--danger);
    }

    /* Layout */
    .container {
      max-width: 1100px;
      margin: 24px auto;
      padding: 0 20px;
    }

    /* Buttons */
    .btn-primary {
      background: var(--accent);
      color: #0b1120;
      font-weight: 600;
      border: none;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      white-space: nowrap;
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      color: #fff;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Form Elements */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-muted);
    }
    .input-field {
      width: 100%;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .input-field:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .input-field.input-error {
      border-color: var(--danger);
    }
    .input-field.input-success {
      border-color: var(--success);
    }
    .input-group {
      display: flex;
      align-items: stretch;
    }
    .input-addon {
      background: var(--bg-surface-hover);
      border: 1px solid var(--border-color);
      border-right: none;
      color: var(--text-dim);
      padding: 0 10px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
      white-space: nowrap;
    }
    .input-group .input-field {
      border-radius: 0;
    }
    .btn-dice {
      background: var(--bg-surface-hover);
      border: 1px solid var(--border-color);
      border-left: none;
      color: var(--text-muted);
      padding: 0 12px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-dice:hover {
      background: var(--border-color);
      color: #fff;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }
    .toolbar-left {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .search-box {
      min-width: 240px;
      position: relative;
    }
    .search-input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 8px 12px 8px 34px;
      border-radius: var(--radius-sm);
      outline: none;
      font-size: 0.88rem;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      font-size: 0.85rem;
      pointer-events: none;
    }
    .cat-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .cat-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .cat-pill:hover {
      background: var(--bg-surface-hover);
      color: var(--text-main);
    }
    .cat-pill.active {
      background: var(--badge-bg);
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 600;
    }
    .stats-info {
      font-size: 0.82rem;
      color: var(--text-dim);
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .stats-highlight {
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Table / List */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    th {
      background: rgba(17, 24, 39, 0.7);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.015);
    }
    .short-link-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .short-link-text {
      color: var(--accent);
      font-weight: 600;
      text-decoration: none;
    }
    .short-link-text:hover {
      text-decoration: underline;
    }
    .btn-copy-icon {
      background: transparent;
      border: none;
      color: var(--text-dim);
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }
    .btn-copy-icon:hover {
      color: var(--text-main);
      background: var(--bg-surface-hover);
    }
    .dest-url {
      color: var(--text-muted);
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .category-badge {
      display: inline-block;
      background: var(--badge-bg);
      color: var(--badge-text);
      border: 1px solid rgba(56, 189, 248, 0.2);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .clicks-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--text-muted);
      font-size: 0.82rem;
    }
    .date-text {
      color: var(--text-dim);
      font-size: 0.78rem;
      white-space: nowrap;
    }
    .actions-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
    }
    .btn-action {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
    }
    .btn-action:hover {
      background: var(--bg-surface-hover);
      color: var(--text-main);
    }
    .btn-action.delete:hover {
      border-color: var(--danger);
      color: var(--danger);
      background: var(--danger-bg);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-dim);
    }
    .empty-icon {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 500;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 24px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      animation: modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes modal-pop {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 1.4rem;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .btn-close:hover { color: var(--text-main); background: var(--bg-surface-hover); }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
    }
    .btn-secondary:hover { background: var(--bg-surface-hover); color: var(--text-main); }

    /* Quick category chips */
    .chip {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      cursor: pointer;
      user-select: none;
    }
    .chip:hover {
      background: var(--bg-surface-hover);
      color: var(--text-main);
      border-color: var(--border-focus);
    }

    /* QR Code Container */
    #qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      padding: 12px 0;
    }
    #qr-container img {
      background: #ffffff;
      padding: 12px;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="toast-container"></div>

  <!-- Navbar -->
  <header class="navbar">
    <div class="navbar-inner">
      <a href="/admin" class="nav-brand">
        <div class="brand-badge">S</div>
        <div class="brand-name">${domain}</div>
      </a>
      <div class="nav-actions">
        <button id="btn-nav-create" class="btn-primary" onclick="openCreateModal()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          + Buat Shortlink
        </button>
        <span class="user-pill">${userEmail || 'Admin'}</span>
        <button id="btn-logout" class="btn-logout" title="Keluar">Keluar</button>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Toolbar: Search & Category Filter -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" class="search-input" placeholder="Cari slug, url, kategori...">
        </div>
        <div class="cat-filters" id="cat-filters">
          <button class="cat-pill active" data-cat="ALL">Semua</button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="stats-info">
          <span>Total: <span id="stat-total" class="stats-highlight">0</span></span>
          <span>Klik: <span id="stat-clicks" class="stats-highlight">0</span></span>
        </div>
      </div>
    </div>

    <!-- Links Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Shortlink</th>
            <th>URL Tujuan</th>
            <th>Kategori</th>
            <th>Klik</th>
            <th>Dibuat</th>
            <th style="text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody id="links-tbody">
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-icon">⏳</div>
              <div>Memuat data shortlink...</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- Create Modal (Popup Form) -->
  <div id="create-modal" class="modal-backdrop">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Buat Shortlink Baru</h3>
          <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 2px;">Format tautan: ${domain}/[slug]</div>
        </div>
        <button type="button" class="btn-close" onclick="closeCreateModal()">&times;</button>
      </div>

      <form id="create-modal-form">
        <!-- URL Tujuan -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label for="modal-input-url">URL Tujuan / Asset *</label>
          <div style="display: flex; gap: 6px;">
            <input type="url" id="modal-input-url" class="input-field" required placeholder="https://domain.com/file-panjang.pdf" autocomplete="off">
            <button type="button" class="btn-secondary" id="btn-paste-url" title="Tempel dari Clipboard" style="white-space: nowrap; padding: 0 10px; font-size: 0.8rem;">📋 Tempel</button>
          </div>
        </div>

        <!-- Slug (Otomatis & Bisa Kustom) -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label for="modal-input-slug">Slug Shortlink * <span style="font-weight: normal; color: var(--text-dim);">(Acak otomatis, bisa diubah)</span></label>
          <div class="input-group">
            <span class="input-addon">${domain}/</span>
            <input type="text" id="modal-input-slug" class="input-field" required placeholder="slug-unik" pattern="[a-zA-Z0-9-_]+" autocomplete="off">
            <button type="button" id="btn-dice-modal" class="btn-dice" title="Acak slug baru">🎲</button>
          </div>
          <div id="slug-feedback" style="font-size: 0.76rem; margin-top: 4px; min-height: 18px;"></div>
        </div>

        <!-- Kategori -->
        <div class="form-group" style="margin-bottom: 8px;">
          <label for="modal-input-category">Kategori <span style="font-weight: normal; color: var(--text-dim);">(Opsional)</span></label>
          <input type="text" id="modal-input-category" list="category-list" class="input-field" placeholder="Contoh: CDN, Asset, Social, Dokumen" autocomplete="off">
          <datalist id="category-list"></datalist>
          <div id="quick-category-chips" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;"></div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeCreateModal()">Batal</button>
          <button type="submit" id="btn-submit-modal-create" class="btn-primary">+ Buat Shortlink</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Modal -->
  <div id="edit-modal" class="modal-backdrop">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Edit Shortlink</h3>
        <button type="button" class="btn-close" onclick="closeEditModal()">&times;</button>
      </div>
      <form id="edit-form">
        <div class="form-group" style="margin-bottom: 14px;">
          <label>Shortlink</label>
          <input type="text" id="edit-slug" class="input-field" readonly style="opacity: 0.7;">
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label for="edit-url">URL Tujuan *</label>
          <input type="url" id="edit-url" class="input-field" required>
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label for="edit-category">Kategori</label>
          <input type="text" id="edit-category" list="category-list" class="input-field">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick="closeEditModal()">Batal</button>
          <button type="submit" id="btn-save-edit" class="btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- QR Modal -->
  <div id="qr-modal" class="modal-backdrop">
    <div class="modal" style="text-align: center;">
      <div class="modal-header">
        <h3 class="modal-title" id="qr-title">QR Code</h3>
        <button type="button" class="btn-close" onclick="closeQrModal()">&times;</button>
      </div>
      <div id="qr-container"></div>
      <div class="modal-actions" style="justify-content: center;">
        <button type="button" class="btn-secondary" onclick="closeQrModal()">Tutup</button>
      </div>
    </div>
  </div>

  <script>
    const DOMAIN = '${domain}';
    const RESERVED_SLUGS = new Set(['login', 'logout', 'admin', 'api', 'favicon.ico', 'robots.txt', 'health', 'static', 'assets', 'public']);
    let allLinks = [];
    let activeCategory = 'ALL';
    let searchQuery = '';

    // Show Toast
    function showToast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }, 3000);
    }

    // Copy to clipboard
    async function copyToClipboard(text, customMsg = 'Shortlink berhasil disalin!') {
      try {
        await navigator.clipboard.writeText(text);
        showToast(customMsg, 'success');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(customMsg, 'success');
      }
    }

    // Format date
    function formatDate(ts) {
      if (!ts) return '-';
      const d = new Date(ts);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    // Fetch all links from API
    async function fetchLinks() {
      try {
        const res = await fetch('/api/links');
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Gagal memuat link');
        }
        allLinks = await res.json();
        updateCategoryFilters();
        renderTable();
      } catch (err) {
        showToast('Gagal memuat data link: ' + err.message, 'error');
      }
    }

    // Update categories filter & datalist
    function updateCategoryFilters() {
      const catCount = {};
      let totalClicks = 0;

      for (const link of allLinks) {
        const cat = link.category || 'Umum';
        catCount[cat] = (catCount[cat] || 0) + 1;
        totalClicks += (link.clicks || 0);
      }

      // Stats
      document.getElementById('stat-total').textContent = allLinks.length;
      document.getElementById('stat-clicks').textContent = totalClicks.toLocaleString('id-ID');

      // Category filters
      const filterBox = document.getElementById('cat-filters');
      filterBox.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'cat-pill ' + (activeCategory === 'ALL' ? 'active' : '');
      allBtn.textContent = 'Semua (' + allLinks.length + ')';
      allBtn.onclick = () => { activeCategory = 'ALL'; updateCategoryFilters(); renderTable(); };
      filterBox.appendChild(allBtn);

      for (const [cat, count] of Object.entries(catCount)) {
        const btn = document.createElement('button');
        btn.className = 'cat-pill ' + (activeCategory === cat ? 'active' : '');
        btn.textContent = cat + ' (' + count + ')';
        btn.onclick = () => { activeCategory = cat; updateCategoryFilters(); renderTable(); };
        filterBox.appendChild(btn);
      }

      // Datalist for autocomplete
      const datalist = document.getElementById('category-list');
      datalist.innerHTML = '';
      for (const cat of Object.keys(catCount)) {
        const opt = document.createElement('option');
        opt.value = cat;
        datalist.appendChild(opt);
      }

      // Quick chips in modal
      const chipsBox = document.getElementById('quick-category-chips');
      chipsBox.innerHTML = '';
      const defaultChips = ['CDN', 'Asset', 'Social', 'Dokumen', 'Umum'];
      const combined = Array.from(new Set([...Object.keys(catCount), ...defaultChips])).slice(0, 7);
      for (const cat of combined) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = '+ ' + cat;
        chip.onclick = () => {
          document.getElementById('modal-input-category').value = cat;
        };
        chipsBox.appendChild(chip);
      }
    }

    // Render Table
    function renderTable() {
      const tbody = document.getElementById('links-tbody');
      tbody.innerHTML = '';

      const filtered = allLinks.filter(item => {
        if (activeCategory !== 'ALL' && (item.category || 'Umum') !== activeCategory) {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchSlug = (item.slug || '').toLowerCase().includes(q);
          const matchUrl = (item.url || '').toLowerCase().includes(q);
          const matchCat = (item.category || '').toLowerCase().includes(q);
          return matchSlug || matchUrl || matchCat;
        }
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-icon">🔗</div>
              <div>Belum ada shortlink \${searchQuery || activeCategory !== 'ALL' ? 'yang sesuai filter' : 'dibuat'}.</div>
            </td>
          </tr>
        \`;
        return;
      }

      for (const link of filtered) {
        const fullShortUrl = 'https://' + DOMAIN + '/' + link.slug;
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>
            <div class="short-link-cell">
              <a href="\${fullShortUrl}" target="_blank" class="short-link-text">/\${escapeHtml(link.slug)}</a>
              <button class="btn-copy-icon" title="Salin Shortlink" onclick="copyToClipboard('\${fullShortUrl}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </td>
          <td>
            <a href="\${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="dest-url" title="\${escapeHtml(link.url)}">
              \${escapeHtml(link.url)}
            </a>
          </td>
          <td>
            <span class="category-badge">\${escapeHtml(link.category || 'Umum')}</span>
          </td>
          <td>
            <span class="clicks-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              \${link.clicks || 0}
            </span>
          </td>
          <td>
            <span class="date-text">\${formatDate(link.createdAt)}</span>
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn-action" title="QR Code" onclick="showQrModal('\${escapeHtml(link.slug)}', '\${fullShortUrl}')">QR</button>
              <button class="btn-action" title="Edit" onclick="openEditModal('\${escapeHtml(link.slug)}', '\${escapeHtml(link.url)}', '\${escapeHtml(link.category || 'Umum')}')">Edit</button>
              <button class="btn-action delete" title="Hapus" onclick="deleteLink('\${escapeHtml(link.slug)}')">Hapus</button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Generate random slug guaranteed unique against loaded allLinks
    function generateUniqueRandomSlug(len = 6) {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      for (let attempt = 0; attempt < 50; attempt++) {
        let res = '';
        for (let i = 0; i < len; i++) {
          res += chars[Math.floor(Math.random() * chars.length)];
        }
        const lower = res.toLowerCase();
        if (!RESERVED_SLUGS.has(lower) && !allLinks.some(l => (l.slug || '').toLowerCase() === lower)) {
          return res;
        }
      }
      return 's' + Math.random().toString(36).substring(2, 7);
    }

    // Validate slug in real time
    function validateSlug(slug) {
      const trimmed = (slug || '').trim().toLowerCase();
      const feedback = document.getElementById('slug-feedback');
      const input = document.getElementById('modal-input-slug');
      const submitBtn = document.getElementById('btn-submit-modal-create');

      if (!trimmed) {
        feedback.innerHTML = '<span style="color: var(--danger);">⚠️ Slug tidak boleh kosong.</span>';
        input.classList.add('input-error');
        input.classList.remove('input-success');
        submitBtn.disabled = true;
        return false;
      }

      if (trimmed.length < 2 || trimmed.length > 64) {
        feedback.innerHTML = '<span style="color: var(--danger);">⚠️ Panjang slug harus antara 2 - 64 karakter.</span>';
        input.classList.add('input-error');
        input.classList.remove('input-success');
        submitBtn.disabled = true;
        return false;
      }

      if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
        feedback.innerHTML = '<span style="color: var(--danger);">⚠️ Hanya diperbolehkan huruf, angka, tanda hubung (-), dan underscore (_).</span>';
        input.classList.add('input-error');
        input.classList.remove('input-success');
        submitBtn.disabled = true;
        return false;
      }

      if (RESERVED_SLUGS.has(trimmed)) {
        feedback.innerHTML = '<span style="color: var(--danger);">❌ Slug "' + escapeHtml(trimmed) + '" merupakan nama sistem yang dilindungi.</span>';
        input.classList.add('input-error');
        input.classList.remove('input-success');
        submitBtn.disabled = true;
        return false;
      }

      // Check duplicates
      const isDuplicate = allLinks.some(l => (l.slug || '').toLowerCase() === trimmed);
      if (isDuplicate) {
        feedback.innerHTML = '<span style="color: var(--danger);">❌ Slug "' + escapeHtml(trimmed) + '" sudah digunakan! Pilih slug lain.</span>';
        input.classList.add('input-error');
        input.classList.remove('input-success');
        submitBtn.disabled = true;
        return false;
      }

      feedback.innerHTML = '<span style="color: var(--success);">✅ Slug tersedia</span>';
      input.classList.remove('input-error');
      input.classList.add('input-success');
      submitBtn.disabled = false;
      return true;
    }

    // Open Create Modal
    function openCreateModal() {
      document.getElementById('modal-input-url').value = '';
      document.getElementById('modal-input-category').value = '';
      
      const uniqueSlug = generateUniqueRandomSlug(6);
      const slugInput = document.getElementById('modal-input-slug');
      slugInput.value = uniqueSlug;
      validateSlug(uniqueSlug);

      document.getElementById('create-modal').classList.add('open');
      setTimeout(() => document.getElementById('modal-input-url').focus(), 50);
    }

    // Close Create Modal
    function closeCreateModal() {
      document.getElementById('create-modal').classList.remove('open');
    }

    // Dice Button inside Modal
    document.getElementById('btn-dice-modal').addEventListener('click', () => {
      const newSlug = generateUniqueRandomSlug(6);
      document.getElementById('modal-input-slug').value = newSlug;
      validateSlug(newSlug);
    });

    // Real-time Slug Input Listener
    document.getElementById('modal-input-slug').addEventListener('input', (e) => {
      validateSlug(e.target.value);
    });

    // Paste URL Button
    document.getElementById('btn-paste-url').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('modal-input-url').value = text.trim();
          showToast('URL berhasil ditempel');
        }
      } catch (err) {
        document.getElementById('modal-input-url').focus();
        showToast('Tekan Ctrl+V untuk menempel URL', 'error');
      }
    });

    // Create Shortlink Submit
    document.getElementById('create-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-modal-create');
      const url = document.getElementById('modal-input-url').value.trim();
      const customSlug = document.getElementById('modal-input-slug').value.trim();
      const category = document.getElementById('modal-input-category').value.trim();

      if (!validateSlug(customSlug)) {
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      try {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, customSlug, category })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Shortlink /' + data.link.slug + ' berhasil dibuat!');
          closeCreateModal();
          await fetchLinks();
        } else {
          showToast(data.message || 'Gagal membuat shortlink', 'error');
        }
      } catch (err) {
        showToast('Terjadi kesalahan jaringan', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Buat Shortlink';
      }
    });

    // Search filter
    document.getElementById('search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderTable();
    });

    // Edit Modal
    function openEditModal(slug, url, category) {
      document.getElementById('edit-slug').value = slug;
      document.getElementById('edit-url').value = url;
      document.getElementById('edit-category').value = category;
      document.getElementById('edit-modal').classList.add('open');
    }
    function closeEditModal() {
      document.getElementById('edit-modal').classList.remove('open');
    }

    document.getElementById('edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const slug = document.getElementById('edit-slug').value;
      const url = document.getElementById('edit-url').value.trim();
      const category = document.getElementById('edit-category').value.trim();
      const btn = document.getElementById('btn-save-edit');

      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      try {
        const res = await fetch('/api/links/' + encodeURIComponent(slug), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, category })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Shortlink berhasil diperbarui');
          closeEditModal();
          await fetchLinks();
        } else {
          showToast(data.message || 'Gagal memperbarui', 'error');
        }
      } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan';
      }
    });

    // Delete Link
    async function deleteLink(slug) {
      if (!confirm('Apakah kamu yakin ingin menghapus shortlink /' + slug + '?')) {
        return;
      }
      try {
        const res = await fetch('/api/links/' + encodeURIComponent(slug), {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Shortlink /' + slug + ' telah dihapus');
          await fetchLinks();
        } else {
          showToast(data.message || 'Gagal menghapus link', 'error');
        }
      } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'error');
      }
    }

    // QR Code Modal
    function showQrModal(slug, fullUrl) {
      document.getElementById('qr-title').textContent = '/' + slug;
      const container = document.getElementById('qr-container');
      container.innerHTML = '';

      const qrImg = document.createElement('img');
      qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(fullUrl);
      qrImg.alt = 'QR Code ' + slug;
      qrImg.width = 180;
      qrImg.height = 180;

      const linkText = document.createElement('div');
      linkText.style.fontSize = '0.85rem';
      linkText.style.color = 'var(--text-muted)';
      linkText.textContent = fullUrl;

      container.appendChild(qrImg);
      container.appendChild(linkText);
      document.getElementById('qr-modal').classList.add('open');
    }
    function closeQrModal() {
      document.getElementById('qr-modal').classList.remove('open');
    }

    // Close modals with Escape key or clicking backdrop
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCreateModal();
        closeEditModal();
        closeQrModal();
      }
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          closeCreateModal();
          closeEditModal();
          closeQrModal();
        }
      });
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
      } catch (e) {
        window.location.href = '/login';
      }
    });

    // Initialize
    fetchLinks();
  </script>
</body>
</html>`;
}

/**
 * Render 404 Not Found Page
 */
export function renderNotFoundPage({ slug = '', domain = 's.ten.my.id' }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Tautan Tidak Ditemukan</title>
  <style>
    ${BASE_STYLES}
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 40px 30px;
      text-align: center;
      max-width: 440px;
      width: 100%;
    }
    .code {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1;
      margin-bottom: 12px;
    }
    .title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .btn-home {
      display: inline-block;
      background: var(--accent);
      color: #0b1120;
      font-weight: 600;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
    }
    .btn-home:hover {
      background: var(--accent-hover);
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="code">404</div>
    <h1 class="title">Tautan Tidak Ditemukan</h1>
    <p class="desc">
      Shortlink <strong>/${slug ? slug : ''}</strong> pada domain <strong>${domain}</strong> tidak terdaftar atau telah dihapus.
    </p>
    <a href="/login" class="btn-home">Masuk ke Dashboard</a>
  </div>
</body>
</html>`;
}
