# Kang Paket API

> **Titip request, balik bawa response.**

**Kang Paket API** adalah desktop API client open source untuk developer — ringan, cepat, dan bisa ngobrol dalam bahasa kamu. Terinspirasi dari semangat "Kang Paket" yang selalu siap antar-jemput, aplikasi ini mengurus semua HTTP request kamu dan balik bawa response yang rapi.

Alternatif lokal untuk Postman, Bruno, dan Insomnia — dengan fokus pada kemudahan manajemen project, collection, dan interoperabilitas format import/export.

---

## Fitur Utama

- **Project & Collection Management** — buat project, susun collection dalam folder, simpan request dengan rapi
- **HTTP Request Builder** — semua method (GET, POST, PUT, DELETE, PATCH, dsb.), headers, query params, body (JSON, form, raw), dan autentikasi (Bearer, Basic, API Key)
- **Response Viewer** — syntax highlighting, pretty-print JSON, lihat headers, timing, dan ukuran response
- **Environments** — kelola variabel untuk Dev, Staging, dan Prod dengan interpolasi `{{VARIABLE}}`
- **JSON Filter** — filter response besar dengan JSONPath (`$.data.users[*].email`) langsung di response viewer
- **Request History** — riwayat request terakhir, grouped by date
- **Import** dari: Postman Collection v2.1, OpenAPI 3.x / Swagger 2.x (JSON & YAML), Bruno, Insomnia v4
- **Export** ke: Postman Collection v2.1, OpenAPI 3.0 (JSON & YAML), Bruno, Insomnia v4

---

## Screenshot

> *Coming soon*

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

# Build distributable
npm run build
npm run dist
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Desktop runtime | Electron 36+ |
| Build toolchain | electron-vite + Vite 6 |
| UI | React 19 + TypeScript 5 |
| State management | Zustand |
| Styling | TailwindCSS v4 |
| Code editor | CodeMirror 6 |
| JSON filter | jsonpath-plus |
| YAML parsing | js-yaml |
| Packaging | electron-builder |

---

## Struktur Folder Project (Format File)

Setiap project disimpan sebagai folder biasa — cocok untuk di-commit ke Git bersama kode kamu.

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
- [ ] App shell & layout
- [ ] HTTP request builder + response viewer
- [ ] Project & collection management
- [ ] Environment variables
- [ ] Import/export multi-format
- [ ] JSON filter panel
- [ ] Request history
- [ ] GitHub Actions release pipeline

---

## Lisensi

Dirilis di bawah lisensi [MIT](LICENSE).

---

<p align="center">
  Dibuat dengan ☕ di Indonesia.
</p>
