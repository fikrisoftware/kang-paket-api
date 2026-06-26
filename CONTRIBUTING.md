# Panduan Kontribusi — Kang Paket API

Terima kasih sudah tertarik berkontribusi! 🎉

Kang Paket API adalah proyek open source dan setiap kontribusi sangat dihargai — mulai dari melaporkan bug, mengusulkan fitur, memperbaiki dokumentasi, hingga mengirim kode.

---

## Daftar Isi

- [Kode Etik](#kode-etik)
- [Cara Melaporkan Bug](#cara-melaporkan-bug)
- [Cara Mengusulkan Fitur](#cara-mengusulkan-fitur)
- [Alur Kontribusi Kode](#alur-kontribusi-kode)
- [Setup Lingkungan Pengembangan](#setup-lingkungan-pengembangan)
- [Konvensi Kode](#konvensi-kode)
- [Konvensi Commit](#konvensi-commit)
- [Proses Review Pull Request](#proses-review-pull-request)

---

## Kode Etik

Proyek ini mengadopsi standar komunikasi yang saling menghormati. Diskusi yang tidak konstruktif, serangan personal, atau konten yang menyinggung tidak akan ditoleransi.

---

## Cara Melaporkan Bug

1. Cek apakah bug sudah dilaporkan di [Issues](https://github.com/fikrisoftware/kang-paket-api/issues)
2. Jika belum ada, buat issue baru dengan template **Bug Report**
3. Sertakan:
   - Versi aplikasi (`Help → About`)
   - Sistem operasi dan versinya
   - Langkah-langkah untuk mereproduksi bug
   - Perilaku yang diharapkan vs yang terjadi
   - Screenshot atau log jika ada

---

## Cara Mengusulkan Fitur

1. Buka [Issues](https://github.com/fikrisoftware/kang-paket-api/issues) dan pilih template **Feature Request**
2. Jelaskan use case dan manfaatnya
3. Diskusikan dengan maintainer sebelum mulai coding — agar effort tidak terbuang jika arah berbeda

---

## Alur Kontribusi Kode

```
1. Fork repo ini
2. Clone fork kamu ke lokal
3. Buat branch baru dari main
4. Coding & commit
5. Push ke fork kamu
6. Buat Pull Request ke repo ini
```

### Langkah Detail

```bash
# 1. Fork di GitHub (klik tombol Fork)

# 2. Clone fork kamu
git clone https://github.com/<username-kamu>/kang-paket-api.git
cd kang-paket-api

# 3. Tambahkan upstream remote
git remote add upstream https://github.com/fikrisoftware/kang-paket-api.git

# 4. Buat branch baru
git checkout -b feat/nama-fitur-kamu
# atau untuk bug fix:
git checkout -b fix/deskripsi-bug

# 5. Install dependencies
npm install

# 6. Jalankan dev mode
npm run dev

# 7. Coding & commit (ikuti konvensi commit di bawah)

# 8. Sync dengan upstream sebelum push
git fetch upstream
git rebase upstream/main

# 9. Push ke fork kamu
git push origin feat/nama-fitur-kamu

# 10. Buka Pull Request di GitHub
```

---

## Setup Lingkungan Pengembangan

**Prasyarat:**
- Node.js v20+
- npm v10+
- Git

```bash
# Clone & install
git clone https://github.com/fikrisoftware/kang-paket-api.git
cd kang-paket-api
npm install

# Jalankan dalam mode development
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

---

## Konvensi Kode

- **TypeScript strict mode** — tidak ada `any` tanpa alasan yang jelas
- **Komponen React** — functional components, tidak ada class components
- **State management** — gunakan Zustand store yang sudah ada, jangan buat state local yang tidak perlu
- **IPC** — renderer tidak boleh akses `fs` atau membuat HTTP request langsung; semua melalui `src/lib/ipc.ts`
- **Penamaan file** — `camelCase.ts` untuk util/hooks, `PascalCase.tsx` untuk komponen React

---

## Konvensi Commit

Format: `<type>(<scope>): <deskripsi singkat>`

| Type | Kapan digunakan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi saja |
| `style` | Formatting, tidak ada perubahan logika |
| `refactor` | Refactor kode tanpa menambah fitur atau fix bug |
| `test` | Menambah atau memperbaiki test |
| `chore` | Update dependency, build config, dsb. |

Contoh:
```
feat(import): tambah parser Insomnia v4
fix(response): perbaiki pretty-print untuk null value
docs(contributing): tambah instruksi setup Windows
```

---

## Proses Review Pull Request

- Setiap PR akan di-review oleh maintainer dalam waktu maksimal **7 hari kerja**
- CI harus hijau (type check + build) sebelum bisa di-merge
- Reviewer mungkin meminta perubahan — tolong respon dengan ramah dan terbuka
- Setelah di-approve, maintainer yang akan melakukan merge

Terima kasih sudah berkontribusi! 🙏
