# Changelog - Fix Multiple File Upload

## 📅 Tanggal: 14 Oktober 2025

## 🎯 Masalah yang Diperbaiki

Error: `Cannot read properties of undefined (reading 'replace')` terjadi saat upload multiple files untuk final project dengan multiple members.

### Root Cause

1. File mapping di controller menggunakan index array yang tidak reliable
2. Tidak ada validasi null/undefined sebelum mengakses file properties
3. Field name upload menggunakan generic name yang menyebabkan file tercampur dalam satu array

## ✅ Perubahan yang Dilakukan

### 1. Routes (`src/routes/mahasiswa/tugasAkhir.ts`)

**Sebelum:**

```typescript
router.post(
  "/daftar",
  uploadFields([
    { name: "draft_path", maxCount: 10 },
    { name: "dispen_path", maxCount: 10 },
  ]),
  create
);
```

**Sesudah:**

```typescript
router.post("/daftar", upload.any(), create);
```

**Alasan:** `upload.any()` memungkinkan dynamic field names seperti `draft_path_0`, `draft_path_1`, dll.

---

### 2. Controller (`src/controllers/mahasiswa/tugasAkhir/createFinalProject.ts`)

**Sebelum:**

```typescript
const files = req.files as { [fieldname: string]: Express.Multer.File[] };

if (bodyData.formData && files) {
  bodyData.formData = bodyData.formData.map((member, index) => {
    return {
      ...member,
      draft_path: files.draft_path?.[index] || null,
      dispen_path: files.dispen_path?.[index] || null,
    };
  });
}
```

**Sesudah:**

```typescript
const files = req.files as Express.Multer.File[];

if (bodyData.members && files && files.length > 0) {
  bodyData.members = bodyData.members.map((member, index) => {
    const draftFile = files.find((f) => f.fieldname === `draft_path_${index}`);
    const dispenFile = files.find(
      (f) => f.fieldname === `dispen_path_${index}`
    );

    return {
      ...member,
      draft_path: draftFile || null,
      dispen_path: dispenFile || null,
    };
  });
}
```

**Perubahan:**

- ✅ `formData` → `members` (konsistensi naming)
- ✅ File cast dari object ke array
- ✅ Gunakan `.find()` berdasarkan fieldname, bukan index array
- ✅ Field name pattern: `draft_path_{index}`, `dispen_path_{index}`

---

### 3. Service (`src/services/mahasiswa/tugasAkhirService.ts`)

**Perubahan:**

- ✅ `formData` → `members` di semua tempat
- ✅ Validasi file lebih robust: check existence DAN buffer property
- ✅ Validasi error messages menggunakan `members[i]` bukan `formData[i]`

**Kode Validasi Baru:**

```typescript
if (
  !item.draft_path ||
  (typeof item.draft_path === "object" && !item.draft_path.buffer)
) {
  return {
    error: {
      field: `members[${i}].draft_path`,
      msg: `Draft anggota ke ${i + 1} harus diunggah`,
    },
  };
}
```

---

### 4. Repository (`src/repositories/FinalProjectRepository.ts`)

**Perubahan:**

- ✅ Type checking sebelum call `saveFile()`
- ✅ Try-catch wrapper untuk file operations
- ✅ Error messages lebih descriptive

**Kode Baru:**

```typescript
if (
  memberData.draft_path &&
  typeof memberData.draft_path === "object" &&
  "buffer" in memberData.draft_path
) {
  try {
    draftPath = await fileUploadUtil.saveFile(
      memberData.draft_path,
      "final-projects/drafts"
    );
  } catch (error) {
    throw new Error(`Failed to save draft file: ${error.message}`);
  }
}
```

---

### 5. Utils (`src/utils/fileUpload.ts`)

**Perubahan:**

- ✅ Accept `Express.Multer.File | null` sebagai parameter
- ✅ Null/undefined checks sebelum akses properties
- ✅ Validasi required properties (originalname, buffer)

**Kode Baru:**

```typescript
async saveFile(file: Express.Multer.File | null, subDir: string): Promise<string> {
  try {
    if (!file) {
      throw new Error("File is null or undefined");
    }

    if (!file.originalname || !file.buffer) {
      throw new Error("File object is missing required properties");
    }

    // ... rest of the code
  }
}
```

---

### 6. Types (`src/types/mahasiswa.ts`)

**Sudah Benar:**

```typescript
export interface FinalProjectCreateRequest {
  type: string;
  status: string;
  source_topic: string;
  supervisor1Id: string;
  supervisor2Id: string;
  finalProjectPeriodId: string | null;
  members: FinalProjectData[]; // ✅ Sudah menggunakan 'members'
}

export interface FinalProjectData {
  email: string;
  student: any;
  title: string;
  resume: string;
  draft_path?: Express.Multer.File | null; // ✅ Optional dan nullable
  dispen_path?: Express.Multer.File | null; // ✅ Optional dan nullable
}
```

---

### 7. Dokumentasi

**File Baru:**

- ✅ `UPLOAD_FILE_GUIDE.md` - Panduan lengkap untuk frontend developer
- ✅ `postman-collection.json` - Collection untuk testing di Postman
- ✅ `CHANGELOG.md` - Dokumen ini

---

## 📋 Cara Frontend Mengirim Request

### Format Baru (WAJIB)

```javascript
const formData = new FormData();

// Data project
formData.append("type", "Skripsi");
formData.append("status", "Pending");
formData.append("source_topic", "Dosen");
formData.append("supervisor1Id", "1");
formData.append("supervisor2Id", "2");
formData.append("finalProjectPeriodId", "1");

// Data members sebagai JSON string
formData.append(
  "members",
  JSON.stringify([
    {
      email: "mahasiswa1@example.com",
      title: "Judul TA Member 1",
      resume: "Resume member 1",
      student: { id: 1 },
    },
    {
      email: "mahasiswa2@example.com",
      title: "Judul TA Member 2",
      resume: "Resume member 2",
      student: { id: 2 },
    },
  ])
);

// Files dengan INDEXED FIELD NAMES
formData.append("draft_path_0", draftFile0); // Member 0
formData.append("dispen_path_0", dispenFile0); // Member 0
formData.append("draft_path_1", draftFile1); // Member 1
formData.append("dispen_path_1", dispenFile1); // Member 1

// Send
await fetch("/api/mahasiswa/tugas-akhir/daftar", {
  method: "POST",
  body: formData,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### ⚠️ PENTING - Field Naming

- ❌ **SALAH:** `draft_path`, `draft_path`, `draft_path` (generic name)
- ✅ **BENAR:** `draft_path_0`, `draft_path_1`, `draft_path_2` (indexed name)

Index harus match dengan posisi member di array `members`.

---

## 🧪 Testing

### Menggunakan Postman

1. Import file `postman-collection.json`
2. Set variable `base_url` (default: http://localhost:3000)
3. Login untuk dapatkan `access_token`
4. Set variable `access_token`
5. Gunakan request "Create Final Project - Single Member" atau "Multiple Members"
6. Upload file PDF/DOC di field yang sesuai

### Manual Testing dengan cURL

```bash
curl -X POST http://localhost:3000/api/mahasiswa/tugas-akhir/daftar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "type=Skripsi" \
  -F "status=Pending" \
  -F "source_topic=Dosen" \
  -F "supervisor1Id=1" \
  -F "supervisor2Id=2" \
  -F "finalProjectPeriodId=1" \
  -F 'members=[{"email":"test@example.com","title":"Test Title","resume":"Test Resume","student":{"id":1}}]' \
  -F "draft_path_0=@/path/to/draft.pdf" \
  -F "dispen_path_0=@/path/to/dispen.pdf"
```

---

## 🔍 Validation Rules

Setiap member HARUS memiliki:

- ✅ Email (valid email format)
- ✅ Title (non-empty string)
- ✅ Resume (non-empty string)
- ✅ Draft file (PDF/DOC/DOCX, max 50MB)
- ✅ Dispensation file (PDF/DOC/DOCX, max 50MB)
- ✅ Student object dengan id

---

## 📊 Response Format

### Success (201)

```json
{
  "message": "Tugas akhir berhasil dibuat",
  "data": {
    "id": 1,
    "type": "Skripsi",
    "status": "Pending",
    "source_topic": "Dosen",
    "members": [...]
  }
}
```

### Error Validation (400)

```json
{
  "message": "Error Validation",
  "errors": {
    "field": "members[0].draft_path",
    "msg": "Draft anggota ke 1 harus diunggah"
  }
}
```

### Error Server (500)

```json
{
  "message": "Terjadi kesalahan",
  "errors": {
    "field": "server",
    "msg": "Failed to save file: ..."
  }
}
```

---

## 🎉 Benefits

1. ✅ **More Reliable** - File mapping tidak akan error lagi
2. ✅ **Better Error Handling** - Error messages yang jelas dan spesifik
3. ✅ **No More Undefined Errors** - Semua null/undefined di-handle dengan baik
4. ✅ **Transaction Safe** - Auto rollback jika ada error
5. ✅ **Better Documentation** - Frontend tahu persis cara implement
6. ✅ **Consistent Naming** - `members` digunakan di semua layer
7. ✅ **Type Safety** - TypeScript types yang lebih akurat

---

## 📝 Migration Notes

### Breaking Changes

⚠️ **Field name `formData` diganti menjadi `members`**

Frontend harus update dari:

```javascript
formData.append('formData', JSON.stringify([...]));
```

Menjadi:

```javascript
formData.append('members', JSON.stringify([...]));
```

⚠️ **File field names harus menggunakan index**

Frontend harus update dari:

```javascript
formData.append("draft_path", file1);
formData.append("draft_path", file2); // ❌ Tidak akan bekerja
```

Menjadi:

```javascript
formData.append("draft_path_0", file1);
formData.append("draft_path_1", file2); // ✅ Benar
```

---

## 👥 Team Notes

- Backend: ✅ Ready for production
- Frontend: ⚠️ Perlu update sesuai dokumentasi baru
- Testing: ✅ Postman collection tersedia
- Documentation: ✅ Lengkap di UPLOAD_FILE_GUIDE.md

---

## 📞 Contact

Jika ada pertanyaan atau issue, silakan buka GitHub issue atau hubungi team backend.
