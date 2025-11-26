# API Documentation - Berita Acara Penilaian (BAP) PDF Generation

## Overview

Sistem generate PDF Berita Acara Penilaian (BAP) untuk mahasiswa yang sudah selesai dinilai oleh dosen. PDF akan di-generate dari template dan disimpan dengan format nama `BAP_NIM.pdf` (contoh: `BAP_121140044.pdf`).

## Features

- ✅ Generate PDF dari template dengan data mahasiswa dan nilai
- ✅ Check otomatis: tidak generate ulang jika PDF sudah ada
- ✅ Validasi semua nilai sudah di-finalisasi
- ✅ Relasi ke student (satu mahasiswa satu PDF unik)
- ✅ Download PDF by student ID atau by filename

## Database Schema

### Table: `berita_acara_pdfs`

```sql
CREATE TABLE berita_acara_pdfs (
  id VARCHAR(36) PRIMARY KEY,
  studentId INT NOT NULL,
  pdfName VARCHAR(255) NOT NULL,
  pdfUrl TEXT NOT NULL,
  nilaiAkhir DECIMAL(5,2) NOT NULL,
  nilaiHuruf VARCHAR(5) NOT NULL,
  jadwalId INT NOT NULL,
  catatan TEXT NULL,
  createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (studentId) REFERENCES student(id) ON DELETE CASCADE,
  INDEX IDX_berita_acara_pdfs_studentId (studentId)
);
```

## API Endpoints

### 1. Generate BAP PDF

Generate PDF BAP untuk mahasiswa tertentu. Akan check dulu apakah PDF sudah ada.

**Endpoint:**

- `POST /api/admin/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap-pdf`
- `POST /api/lecturer/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap-pdf`

**Auth Required:** Yes (Admin or Lecturer)

**Path Parameters:**

- `jadwalId` (integer): ID jadwal sidang
- `studentId` (integer): ID mahasiswa

**Success Response (200 OK):**

```json
{
  "message": "BAP berhasil di-generate",
  "data": {
    "id": "uuid-string",
    "pdfName": "BAP_121140044.pdf",
    "pdfUrl": "/storage/bap-pdf/BAP_121140044.pdf",
    "nilaiAkhir": 85.5,
    "nilaiHuruf": "A",
    "generatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// PDF sudah ada (masih 200 OK, return existing PDF)
{
  "message": "BAP berhasil di-generate",
  "data": { ... } // existing PDF data
}

// Belum semua dosen finalisasi nilai (500)
{
  "message": "Terjadi kesalahan saat generate BAP",
  "errors": {
    "path": "server",
    "msg": "Tidak semua dosen sudah memfinalisasi nilai. BAP tidak dapat di-generate."
  }
}

// Belum ada penilaian (500)
{
  "message": "Terjadi kesalahan saat generate BAP",
  "errors": {
    "path": "server",
    "msg": "Belum ada penilaian untuk membuat BAP"
  }
}
```

---

### 2. Get BAP Info by Student

Mendapatkan informasi BAP untuk mahasiswa tertentu.

**Endpoint:**

- `GET /api/admin/penilaian/student/:studentId/bap`
- `GET /api/lecturer/penilaian/student/:studentId/bap`

**Auth Required:** Yes (Admin or Lecturer)

**Path Parameters:**

- `studentId` (integer): ID mahasiswa

**Success Response (200 OK):**

```json
{
  "message": "BAP info retrieved successfully",
  "data": {
    "id": "uuid-string",
    "pdfName": "BAP_121140044.pdf",
    "pdfUrl": "/storage/bap-pdf/BAP_121140044.pdf",
    "nilaiAkhir": 85.5,
    "nilaiHuruf": "A",
    "generatedAt": "2025-01-15T10:30:00.000Z",
    "student": {
      "id": 1,
      "nim": "121140044",
      "name": "John Doe"
    }
  }
}
```

**Error Response (404):**

```json
{
  "message": "BAP tidak ditemukan",
  "errors": {
    "path": "studentId",
    "msg": "BAP belum di-generate untuk mahasiswa ini"
  }
}
```

---

### 3. Download BAP by Student

Download file PDF BAP berdasarkan student ID.

**Endpoint:**

- `GET /api/admin/penilaian/student/:studentId/bap/download`
- `GET /api/lecturer/penilaian/student/:studentId/bap/download`

**Auth Required:** Yes (Admin or Lecturer)

**Path Parameters:**

- `studentId` (integer): ID mahasiswa

**Success Response:**

- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="BAP_121140044.pdf"`
- Binary PDF file

**Error Response (404):**

```json
{
  "message": "BAP tidak ditemukan",
  "errors": {
    "path": "studentId",
    "msg": "BAP belum di-generate untuk mahasiswa ini"
  }
}
```

---

### 4. Download BAP by Filename

Download file PDF BAP berdasarkan nama file.

**Endpoint:**

- `GET /api/admin/penilaian/bap/download/:pdfName`
- `GET /api/lecturer/penilaian/bap/download/:pdfName`

**Auth Required:** Yes (Admin or Lecturer)

**Path Parameters:**

- `pdfName` (string): Nama file PDF (contoh: `BAP_121140044.pdf`)

**Success Response:**

- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="BAP_121140044.pdf"`
- Binary PDF file

**Error Response (404):**

```json
{
  "message": "BAP tidak ditemukan",
  "errors": {
    "path": "pdfName",
    "msg": "BAP tidak ditemukan di database"
  }
}
```

---

### 5. Get All BAP

Mendapatkan list semua BAP yang sudah di-generate.

**Endpoint:** `GET /api/admin/penilaian/bap/all`

**Auth Required:** Yes (Admin only)

**Success Response (200 OK):**

```json
{
  "message": "All BAP retrieved successfully",
  "data": [
    {
      "id": "uuid-string-1",
      "pdfName": "BAP_121140044.pdf",
      "pdfUrl": "/storage/bap-pdf/BAP_121140044.pdf",
      "nilaiAkhir": 85.5,
      "nilaiHuruf": "A",
      "generatedAt": "2025-01-15T10:30:00.000Z",
      "student": {
        "id": 1,
        "nim": "121140044",
        "name": "John Doe"
      }
    },
    {
      "id": "uuid-string-2",
      "pdfName": "BAP_121140055.pdf",
      "pdfUrl": "/storage/bap-pdf/BAP_121140055.pdf",
      "nilaiAkhir": 90.0,
      "nilaiHuruf": "A",
      "generatedAt": "2025-01-15T11:00:00.000Z",
      "student": {
        "id": 2,
        "nim": "121140055",
        "name": "Jane Smith"
      }
    }
  ]
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Generate BAP PDF Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. Frontend Request
   │
   ├─> POST /api/admin/penilaian/jadwal/:jadwalId/student/:studentId/generate-bap-pdf
   │
2. Server Processing
   │
   ├─> Check: PDF sudah ada? (by pdfName: BAP_NIM.pdf)
   │   ├─> YES: Return existing PDF (tidak generate ulang)
   │   └─> NO: Lanjut ke step berikutnya
   │
   ├─> Validasi: Semua nilai sudah di-finalisasi?
   │   ├─> NO: Return error
   │   └─> YES: Lanjut
   │
   ├─> Get data:
   │   ├─> Student data (nim, name)
   │   ├─> Final project data (title, dosen pembimbing)
   │   ├─> Jadwal sidang (date, time)
   │   └─> Rekap nilai (nilai akhir, per dosen)
   │
   ├─> Load PDF template (templates/templates_BAP.pdf)
   │
   ├─> Populate data ke PDF
   │   ├─> Nama mahasiswa, NIM
   │   ├─> Judul TA
   │   ├─> Dosen pembimbing & penguji
   │   ├─> Tanggal sidang
   │   ├─> Tabel nilai per dosen
   │   └─> Nilai akhir
   │
   ├─> Save PDF ke: /storages/bap-pdf/BAP_NIM.pdf
   │
   ├─> Save metadata ke database (table: berita_acara_pdfs)
   │
3. Response
   │
   └─> Return: pdfName, pdfUrl, nilaiAkhir, nilaiHuruf
```

---

## Usage Example (Frontend)

### React/Next.js Example

```typescript
// Generate BAP
const generateBAP = async (jadwalId: number, studentId: number) => {
  try {
    const response = await fetch(
      `/api/admin/penilaian/jadwal/${jadwalId}/student/${studentId}/generate-bap-pdf`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("BAP generated:", data.data);
      // Auto download
      downloadBAP(studentId);
    } else {
      console.error("Error:", data.message);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

// Download BAP
const downloadBAP = (studentId: number) => {
  window.location.href = `/api/admin/penilaian/student/${studentId}/bap/download`;
};

// Get BAP Info
const getBAPInfo = async (studentId: number) => {
  const response = await fetch(
    `/api/admin/penilaian/student/${studentId}/bap`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data.data;
  }
  return null;
};
```

---

## File Structure

```
src/
├── entities/
│   └── beritaAcaraPDF.ts          # Entity untuk table berita_acara_pdfs
├── repositories/
│   └── BeritaAcaraPDFRepository.ts # Repository operations
├── services/
│   └── admin/
│       └── bapPdfService.ts        # Business logic generate PDF
├── controllers/
│   └── admin/
│       └── penilaian/
│           └── bapPdfController.ts # Handle HTTP requests
├── routes/
│   └── admin/
│       └── penilaian.ts            # Route definitions
├── migrations/
│   └── 1700000000000-AddBeritaAcaraPdfTable.ts
├── storages/
│   └── bap-pdf/                    # Folder penyimpanan PDF
└── templates/
    └── templates_BAP.pdf           # Template PDF BAP
```

---

## Notes

1. **PDF Naming Convention:** Format `BAP_NIM.pdf` (contoh: `BAP_121140044.pdf`)
2. **No Duplicate:** Sistem akan check apakah PDF sudah ada sebelum generate
3. **Validation:** Semua nilai harus sudah di-finalisasi sebelum generate PDF
4. **Storage:** PDF disimpan di `src/storages/bap-pdf/`
5. **Template:** Edit koordinat di `bapPdfService.ts` sesuai posisi field di template PDF

---

## Troubleshooting

### PDF tidak ter-generate

- Check apakah semua dosen sudah finalisasi nilai
- Check apakah sudah ada penilaian untuk jadwal tersebut
- Check file template `templates/templates_BAP.pdf` ada

### Koordinat text tidak sesuai

- Edit koordinat di method `createPdfFromTemplate()` di file `bapPdfService.ts`
- Adjust nilai `x`, `y`, dan `fontSize` sesuai template PDF

### File tidak bisa di-download

- Check folder `src/storages/bap-pdf/` exists dan writable
- Check file PDF ada di storage

---

## Migration

Untuk apply migration:

```bash
# Development
npm run migrate:fresh

# Production
npm run build
npm start
```

Migration akan otomatis running saat aplikasi start karena `migrationsRun: true` di data-source config.
