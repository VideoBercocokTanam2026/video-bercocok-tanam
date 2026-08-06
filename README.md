# Video Bercocok Tanam

Website statis (HTML5, CSS3, Vanilla JavaScript — tanpa framework, tanpa backend, tanpa database) untuk menampilkan video vlog bercocok tanam yang di-hosting di Google Drive. Dibuat khusus agar dapat langsung dipublikasikan di **GitHub Pages**.

## Struktur Folder

```text
video-bercocok-tanam/
│
├── index.html          # Halaman utama
├── style.css            # Semua styling (tema hijau daun + coklat kayu, dark mode)
├── script.js             # Logika aplikasi (render video, pencarian, player, dsb.)
├── videos.json           # Sumber data seluruh video
├── README.md             # Dokumen ini
├── robots.txt             # Aturan crawling mesin pencari
├── sitemap.xml            # Peta situs untuk SEO
│
└── assets/
    ├── logo.png            # Logo header & footer
    ├── favicon.ico          # Ikon tab browser
    ├── noimage.jpg           # Gambar cadangan jika thumbnail gagal dimuat
    └── thumbnails/             # Folder thumbnail tiap video
```

## Cara Menjalankan di Lokal

Karena website ini murni statis, cukup jalankan server lokal sederhana agar `fetch("videos.json")` berhasil (membuka `index.html` langsung lewat `file://` akan diblokir oleh kebijakan CORS browser).

Pilih salah satu:

```bash
# Menggunakan Python
python3 -m http.server 8000

# Menggunakan Node.js (npx)
npx serve .
```

Lalu buka `http://localhost:8000` di browser.

## Cara Upload ke GitHub

1. Buat repository baru di GitHub, misalnya `video-bercocok-tanam`.
2. Di folder proyek ini, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: website Video Bercocok Tanam"
   git branch -M main
   git remote add origin https://github.com/USERNAME/video-bercocok-tanam.git
   git push -u origin main
   ```
3. Ganti `USERNAME` dengan username GitHub Anda.

## Cara Mengaktifkan GitHub Pages

1. Buka repository di GitHub → tab **Settings**.
2. Pilih menu **Pages** di sidebar kiri.
3. Pada **Source**, pilih branch `main` dan folder `/root`, lalu klik **Save**.
4. Tunggu beberapa menit, website akan aktif di:
   `https://USERNAME.github.io/video-bercocok-tanam/`
5. Perbarui semua URL placeholder (`https://username.github.io/video-bercocok-tanam/`) di `index.html`, `robots.txt`, dan `sitemap.xml` agar sesuai dengan URL asli Anda.

## Cara Menambah Video Baru

Cukup edit `videos.json` — **tidak perlu mengubah HTML sama sekali**. Tambahkan objek baru ke dalam array:

```json
{
  "id": "slug-unik-video",
  "title": "Judul Video",
  "date": "2026-08-10",
  "thumbnail": "assets/thumbnails/nama-file.jpg",
  "video": "https://drive.google.com/file/d/FILE_ID/preview",
  "description": "Deskripsi singkat video.",
  "category": "Sayuran",
  "popular": false
}
```

Keterangan field:

| Field         | Wajib | Keterangan                                                             |
|---------------|-------|--------------------------------------------------------------------------|
| `id`          | Ya    | Slug unik, dipakai di URL (`#id-ini`). Gunakan huruf kecil dan tanda `-`. |
| `title`       | Ya    | Judul video.                                                              |
| `date`        | Ya    | Format `YYYY-MM-DD`, dipakai untuk urutan "Video Terbaru".               |
| `thumbnail`   | Ya    | Path gambar thumbnail. Jika gagal dimuat, otomatis diganti `noimage.jpg`. |
| `video`       | Ya    | Link Google Drive format `.../preview`.                                   |
| `description` | Ya    | Deskripsi video yang tampil di bawah player.                              |
| `category`    | Tidak | Label kategori (opsional, tampil sebagai badge).                          |
| `popular`     | Tidak | `true`/`false`, menentukan tampil di sidebar "Video Populer".            |

### Cara Mendapatkan Link Google Drive Format `/preview`

1. Upload video ke Google Drive.
2. Klik kanan file → **Bagikan** → atur akses menjadi **"Siapa saja yang memiliki link"**.
3. Salin link, formatnya biasanya: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
4. Ganti bagian akhir `view?usp=sharing` menjadi `preview`, sehingga menjadi:
   `https://drive.google.com/file/d/FILE_ID/preview`

## Cara Mengganti Thumbnail

1. Simpan gambar baru (disarankan rasio 16:9, misalnya 640×360px) ke folder `assets/thumbnails/`.
2. Perbarui nilai `thumbnail` pada entri video terkait di `videos.json` agar mengarah ke file tersebut.

## Cara Mengganti Logo

Ganti file `assets/logo.png` dengan logo baru Anda. Disarankan menggunakan gambar PNG transparan dengan rasio kurang lebih 3:1 (contoh: 480×160px) agar tetap proporsional di header maupun footer.

## Cara Mengganti Favicon

Ganti file `assets/favicon.ico` dengan ikon baru (format `.ico`, disarankan ukuran 32×32px atau 64×64px).

## Cara Memasang Iklan Adsterra

Di dalam `index.html`, cari komentar placeholder berikut dan tempelkan script Adsterra Anda tepat di dalamnya:

```html
<!-- HEADER ADS -->
<!-- SIDEBAR ADS TOP -->
<!-- SIDEBAR ADS BOTTOM -->
<!-- UNDER VIDEO ADS -->
<!-- VIDEO LIST ADS -->
<!-- FOOTER ADS -->
```

Setelah script ditempel, Anda bisa menghapus elemen `<span class="ad-label">Iklan</span>` pada slot yang sama agar tidak tumpang tindih dengan iklan asli.

## Fitur yang Tersedia

- Desain responsif (desktop, tablet, mobile)
- Mode gelap/terang (tersimpan otomatis di perangkat pengguna)
- Pencarian video secara langsung (real-time)
- Daftar "Video Terbaru" & "Video Populer" di sidebar
- Salin link video, bagikan ke WhatsApp & Facebook
- Tombol kembali ke atas (scroll to top)
- Loading skeleton saat video dimuat
- Lazy loading thumbnail gambar
- Header sticky
- Breadcrumb navigasi
- Meta SEO lengkap: Open Graph, Twitter Card, Canonical URL, `robots.txt`, `sitemap.xml`
- Penanganan error otomatis jika video gagal dimuat atau thumbnail tidak ditemukan
- Perpindahan video tanpa reload halaman (menggunakan History API)

## Maintenance / Perawatan Rutin

- **Menambah video**: cukup edit `videos.json`, tidak perlu sentuh file lain.
- **Cek link Google Drive**: pastikan setting berbagi file tetap "Siapa saja yang memiliki link", karena jika diubah menjadi privat, video tidak akan bisa diputar.
- **Perbarui `sitemap.xml`** secara berkala jika Anda menambahkan halaman baru di kemudian hari.
- **Uji performa** secara berkala menggunakan [Google PageSpeed Insights](https://pagespeed.web.dev/) atau Lighthouse di Chrome DevTools.
- **Backup** folder proyek secara berkala, terutama sebelum melakukan perubahan besar pada `style.css` atau `script.js`.

## Catatan Teknis

- Semua warna, tipografi, dan ukuran spasi dikelola lewat CSS custom properties di bagian atas `style.css` (`:root`), sehingga mudah disesuaikan tanpa perlu mengubah struktur CSS lainnya.
- Website ini murni file statis: aman digunakan untuk hosting apa pun yang mendukung file statis (GitHub Pages, Netlify, Vercel, Cloudflare Pages, dll.), tidak hanya GitHub Pages.
