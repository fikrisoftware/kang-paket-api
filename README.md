# Kang Paket API

> **Titip request, balik bawa response.**

**Kang Paket API** adalah desktop API client open source untuk developer — ringan, cepat, dan bisa ngobrol dalam bahasa kamu. Terinspirasi dari semangat "Kang Paket" yang selalu siap antar-jemput, aplikasi ini mengurus semua HTTP request kamu dan balik bawa response yang rapi.

Alternatif lokal untuk Postman, Bruno, dan Insomnia — dengan fokus pada kemudahan manajemen project, collection, dan interoperabilitas format import/export.

---

## Screenshot

### Dark Mode
![Kang Paket API — Dark Mode](docs/screenshots/dark-mode.png)

### Light Mode
![Kang Paket API — Light Mode](docs/screenshots/light-mode.png)

> Screenshot akan diupdate seiring perkembangan fitur.

---

## Fitur

### Sudah Tersedia ✅
- **Multi-tab** — buka beberapa request sekaligus, state tersimpan otomatis
- **HTTP Request Builder** — semua method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **Request Params** — sinkronisasi dua arah dengan URL query string
- **Request Headers** — key-value editor dengan toggle enable/disable
- **Request Body** — JSON (dengan syntax highlighting), text, form-urlencoded
- **Autentikasi** — Bearer token, Basic Auth, API Key (header atau query)
- **Response Viewer** — status badge berwarna, timing, ukuran response
- **Response Body** — syntax highlighting JSON, pretty-print otomatis
- **Response Headers** — tabel sortable
- **Copy & Download** — salin atau unduh response body
- **Dark / Light Mode** — toggle tema, tersimpan otomatis
- **Sidebar** — navigasi Collections dan History
- **Project Management** — buka project dari folder lokal

### Segera Hadir 🚧
- **Collections** — simpan dan organisir request dalam folder
- **Environments** — variabel `{{BASE_URL}}`, `{{TOKEN}}` untuk Dev/Staging/Prod
- **JSON Filter** — filter response besar dengan JSONPath (`$.data.users[*].email`)
- **Request History** — riwayat request terakhir grouped by date
- **Import** dari: Postman Collection v2.1, OpenAPI 3.x/Swagger, Bruno, Insomnia v4
- **Export** ke: Postman, OpenAPI (JSON & YAML), Bruno, Insomnia

---

## Instalasi

### Download Binary

Unduh installer terbaru dari halaman [Releases](https://github.com/fikrisoftware/kang-paket-api/releases).

| Platform | File |
|---|---|
| Windows | `Kang.Paket.API_x.x.x_x64-setup.exe` |
| macOS | `Kang.Paket.API_x.x.x_x64.dmg` |
| Linux | `Kang.Paket.API_x.x.x_amd64.AppImage` |

### Build dari Source

**Prasyarat:**
- [Node.js](https://nodejs.org) v20+
- npm v10+

```bash
# Clone repo
git clone https://github.com/fikrisoftware/kang-paket-api.git
cd kang-paket-api

# Install dependencies
npm install

# Jalankan dalam mode development
npm run dev

# Type check
npm run typecheck

# Build distributable
npm run build
npm run dist
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Desktop runtime | Electron 34+ |
| Build toolchain | electron-vite + Vite 6 |
| UI | React 19 + TypeScript 5 |
| State management | Zustand + persist |
| Styling | TailwindCSS v4 + CSS variables |
| Code editor | CodeMirror 6 |
| JSON filter | jsonpath-plus |
| YAML parsing | js-yaml |
| Packaging | electron-builder |

---

## Struktur Folder Project (Format File)

Setiap project disimpan sebagai folder biasa — human-readable dan cocok untuk di-commit ke Git bersama kode kamu.

```
my-api-project/
├── kangpaket.project.json     # Metadata project
├── environments/
│   ├── dev.env.json
│   ├── staging.env.json
│   └── prod.env.json
└── collections/
    └── Auth/
        ├── collection.json
        ├── login.kp.json
        └── refresh-token.kp.json
```

---

## Kontribusi

Kontribusi sangat disambut! Bacalah [CONTRIBUTING.md](CONTRIBUTING.md) terlebih dahulu.

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buat Pull Request

### Melaporkan Bug atau Request Fitur

Gunakan [GitHub Issues](https://github.com/fikrisoftware/kang-paket-api/issues) untuk melaporkan bug atau mengusulkan fitur baru.

---

## Roadmap

- [x] Desain arsitektur & format file
- [x] App shell & layout (sidebar, tab bar, theming)
- [x] HTTP request builder + response viewer
- [ ] Project & collection management (save/load ke file)
- [ ] Environment variables (`{{VAR}}` substitution)
- [ ] Import/export multi-format (Postman, OpenAPI, Bruno, Insomnia)
- [ ] JSON filter panel (JSONPath / Ayakan)
- [ ] Request history
- [ ] GitHub Actions release pipeline (Win/Mac/Linux)

---

## Lisensi

Dirilis di bawah lisensi [MIT](LICENSE).

---

<p align="center">
  Dibuat dengan ☕ di Indonesia &nbsp;•&nbsp;
  <a href="https://github.com/fikrisoftware/kang-paket-api/issues">Laporkan Bug</a> &nbsp;•&nbsp;
  <a href="https://github.com/fikrisoftware/kang-paket-api/issues">Request Fitur</a>
</p>
