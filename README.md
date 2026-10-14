# s.ten.my.id - Personal URL Shortener & CDN Asset Platform

Platform personal URL shortener dan manajemen tautan aset/CDN yang cepat, ringan, dan aman. Berjalan di atas **Cloudflare Workers** dengan database **Cloudflare KV**.

## Fitur Utama

- **Fokus Fungsi & UI/UX Bersih**: Tampilan modern, minimalis, dan fungsional tanpa fitur yang berlebihan.
- **Dukungan Domain `s.ten.my.id`**: Format tautan `https://s.ten.my.id/<slug>`.
- **Slug Acak & Kustom**:
  - Generator slug acak 6-karakter unik.
  - Dukungan kustom path/slug (contoh: `s.ten.my.id/portfolio`, `s.ten.my.id/resume`).
- **Pengelompokan Kategori**:
  - Label kategori untuk setiap tautan (misal: `CDN`, `Asset`, `Social`, `Dokumen`).
  - Filter cepat per kategori dan pencarian instan.
- **Pelacakan Statistik & QR Code**:
  - Penghitung jumlah klik otomatis di edge tanpa memperlambat redirect.
  - Generator QR code untuk setiap tautan.
- **Autentikasi Aman**:
  - Menggunakan signed session cookie (HMAC-SHA256 via Web Crypto API).
  - Kredensial email & password diambil langsung dari **Cloudflare Environment Variables / Secrets**.

---

## Konfigurasi Cloudflare

### 1. KV Namespace
Konfigurasi KV telah disetel pada `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "DB_KV"
id = "90962425ca2b4ad9a35962afc35f3690"
```

### 2. Variabel Lingkungan (Cloudflare Dashboard)
Di Cloudflare Dashboard: **Workers & Pages** > **s-ten-my-id** > **Settings** > **Variables and Secrets**:

Tambahkan variabel berikut:
| Nama Variabel | Jenis | Deskripsi |
| :--- | :--- | :--- |
| `ADMIN_EMAIL` | Plaintext / Secret | Email untuk login dashboard |
| `ADMIN_PASSWORD` | Secret | Password untuk login dashboard |
| `SESSION_SECRET` | Secret (Opsional) | Kunci rahasia untuk tanda tangan sesi |
| `DEFAULT_DOMAIN` | Plaintext (Opsional)| Default: `s.ten.my.id` |

---

## Pengembangan Lokal

1. Salin template variabel lokal:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Isi nilai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada file `.dev.vars`.
3. Jalankan server lokal:
   ```bash
   npx wrangler dev
   ```
4. Buka di browser `http://localhost:8787`.

---

## Menjalankan Pengujian

Proyek ini dilengkapi dengan unit test bawaan menggunakan Node.js Test Runner:

```bash
npm test
```

---

## Deploy ke Cloudflare

Untuk mendeploy langsung ke Cloudflare Workers:

```bash
npx wrangler deploy
```

Setelah deploy, pastikan custom domain `s.ten.my.id` telah diarahkan ke worker ini melalui menu **Settings > Triggers > Custom Domains** di Cloudflare Dashboard.

---

## Lisensi
MIT License - Personal Use.
