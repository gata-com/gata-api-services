I# Upload File Guide - Final Project Registration

## Overview

Panduan ini menjelaskan cara upload multiple files saat registrasi tugas akhir dengan multiple members.

## Perubahan Penting

Backend sekarang menggunakan **dynamic field names** untuk handle multiple file uploads dengan lebih baik. Setiap file member harus menggunakan indexed field names.

## Konfigurasi Backend

- Route: `POST /api/mahasiswa/tugas-akhir/daftar`
- Upload Method: `upload.any()` (menerima field name apapun)
- Max File Size: 50MB per file
- Allowed Types: PDF, DOC, DOCX, XLS, XLSX

## Implementasi Frontend

### Konvensi Penamaan Field

Untuk setiap member pada index `i`, gunakan field names berikut:

- Draft file: `draft_path_{i}` (contoh: `draft_path_0`, `draft_path_1`, `draft_path_2`)
- Dispensation file: `dispen_path_{i}` (contoh: `dispen_path_0`, `dispen_path_1`, `dispen_path_2`)

### Contoh: FormData dengan Multiple Members

```javascript
const formData = new FormData();

// Data utama project
formData.append("type", "Skripsi");
formData.append("status", "Pending");
formData.append("source_topic", "Dosen");
formData.append("supervisor1Id", "123");
formData.append("supervisor2Id", "456");
formData.append("finalProjectPeriodId", "789");

// Data member (sebagai JSON string)
const membersData = [
  {
    email: "mahasiswa1@example.com",
    title: "Judul Tugas Akhir Member 1",
    resume: "Resume singkat member 1...",
    student: { id: 1, name: "Mahasiswa 1" },
  },
  {
    email: "mahasiswa2@example.com",
    title: "Judul Tugas Akhir Member 2",
    resume: "Resume singkat member 2...",
    student: { id: 2, name: "Mahasiswa 2" },
  },
  {
    email: "mahasiswa3@example.com",
    title: "Judul Tugas Akhir Member 3",
    resume: "Resume singkat member 3...",
    student: { id: 3, name: "Mahasiswa 3" },
  },
];

formData.append("members", JSON.stringify(membersData));

// Files untuk setiap member - PENTING: Gunakan indexed field names
formData.append("draft_path_0", draftFile0); // Draft untuk member 0
formData.append("dispen_path_0", dispenFile0); // Dispen untuk member 0

formData.append("draft_path_1", draftFile1); // Draft untuk member 1
formData.append("dispen_path_1", dispenFile1); // Dispen untuk member 1

formData.append("draft_path_2", draftFile2); // Draft untuk member 2
formData.append("dispen_path_2", dispenFile2); // Dispen untuk member 2

// Kirim request
fetch("/api/mahasiswa/tugas-akhir/daftar", {
  method: "POST",
  body: formData,
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
  },
});
```

### Contoh: Implementasi React

```javascript
import React, { useState } from "react";

function FinalProjectForm() {
  const [members, setMembers] = useState([
    { email: "", title: "", resume: "", draftFile: null, dispenFile: null },
  ]);

  const handleFileChange = (index, fileType, file) => {
    const newMembers = [...members];
    newMembers[index][fileType] = file;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Append data utama project
    formData.append("type", "Skripsi");
    formData.append("status", "Pending");
    formData.append("source_topic", "Dosen");
    formData.append("supervisor1Id", supervisorId1);
    formData.append("supervisor2Id", supervisorId2);
    formData.append("finalProjectPeriodId", periodId);

    // Prepare data member (tanpa files)
    const membersData = members.map((m) => ({
      email: m.email,
      title: m.title,
      resume: m.resume,
      student: m.student,
    }));

    formData.append("members", JSON.stringify(membersData));

    // Append files dengan indexed field names
    members.forEach((member, index) => {
      if (member.draftFile) {
        formData.append(`draft_path_${index}`, member.draftFile);
      }
      if (member.dispenFile) {
        formData.append(`dispen_path_${index}`, member.dispenFile);
      }
    });

    // Kirim request
    try {
      const response = await fetch("/api/mahasiswa/tugas-akhir/daftar", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("Sukses:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {members.map((member, index) => (
        <div key={index}>
          <h3>Anggota {index + 1}</h3>
          <input
            type="email"
            placeholder="Email"
            value={member.email}
            onChange={(e) => {
              const newMembers = [...members];
              newMembers[index].email = e.target.value;
              setMembers(newMembers);
            }}
          />
          <input
            type="text"
            placeholder="Judul"
            value={member.title}
            onChange={(e) => {
              const newMembers = [...members];
              newMembers[index].title = e.target.value;
              setMembers(newMembers);
            }}
          />
          <textarea
            placeholder="Resume"
            value={member.resume}
            onChange={(e) => {
              const newMembers = [...members];
              newMembers[index].resume = e.target.value;
              setMembers(newMembers);
            }}
          />
          <div>
            <label>File Draft:</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                handleFileChange(index, "draftFile", e.target.files[0])
              }
            />
          </div>
          <div>
            <label>File Dispensasi:</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                handleFileChange(index, "dispenFile", e.target.files[0])
              }
            />
          </div>
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}

export default FinalProjectForm;
```

### Contoh: HTML Form (Basic)

```html
<form
  action="/api/mahasiswa/tugas-akhir/daftar"
  method="POST"
  enctype="multipart/form-data"
>
  <!-- Data Utama -->
  <input type="hidden" name="type" value="Skripsi" />
  <input type="hidden" name="status" value="Pending" />
  <input type="hidden" name="source_topic" value="Dosen" />
  <input type="hidden" name="supervisor1Id" value="123" />
  <input type="hidden" name="supervisor2Id" value="456" />
  <input type="hidden" name="finalProjectPeriodId" value="789" />

  <!-- Data Member sebagai JSON -->
  <input
    type="hidden"
    name="members"
    value='[{"email":"mahasiswa1@example.com","title":"Judul 1","resume":"Resume 1","student":{"id":1}}]'
  />

  <!-- Files Member 0 -->
  <label>Anggota 1 - Draft:</label>
  <input type="file" name="draft_path_0" required />

  <label>Anggota 1 - Dispensasi:</label>
  <input type="file" name="dispen_path_0" required />

  <!-- Files Member 1 -->
  <label>Anggota 2 - Draft:</label>
  <input type="file" name="draft_path_1" required />

  <label>Anggota 2 - Dispensasi:</label>
  <input type="file" name="dispen_path_1" required />

  <button type="submit">Submit</button>
</form>
```

## Masalah Umum dan Solusi

### Masalah 1: "File is null or undefined"

**Penyebab:** File tidak terlampir dengan benar atau field name salah
**Solusi:** Pastikan field names sesuai pola `draft_path_{index}` dan `dispen_path_{index}`

### Masalah 2: "Failed to save file: File object is missing required properties"

**Penyebab:** File object tidak memiliki buffer atau originalname
**Solusi:** Pastikan Anda mengirim File object yang sebenarnya, bukan string atau nilai kosong

### Masalah 3: Index Tidak Cocok

**Penyebab:** Index file tidak sesuai dengan index member di array members
**Solusi:** Pastikan index file sesuai dengan posisi member di array members

## Aturan Validasi

Setiap member HARUS memiliki:

- ✅ Email yang valid
- ✅ Title (string tidak kosong)
- ✅ Resume (string tidak kosong)
- ✅ Draft file (PDF/DOC/DOCX, max 50MB)
- ✅ File dispensasi (PDF/DOC/DOCX, max 50MB)

## Contoh Response

### Response Sukses (201)

```json
{
  "message": "Tugas akhir berhasil dibuat",
  "data": {
    "id": 1,
    "type": "Skripsi",
    "status": "Pending",
    "members": [...]
  }
}
```

### Response Error (400)

```json
{
  "message": "Error Validation",
  "errors": {
    "field": "formData[0].draft_path",
    "msg": "Draft anggota ke 1 harus diunggah"
  }
}
```

### Response Error (500)

```json
{
  "message": "Terjadi kesalahan",
  "errors": {
    "field": "server",
    "msg": "Failed to save file: ..."
  }
}
```

## Testing dengan Postman

1. Buat POST request baru ke `/api/mahasiswa/tugas-akhir/daftar`
2. Ke tab **Body**
3. Pilih **form-data**
4. Tambahkan fields:
   - `type` (text): "Skripsi"
   - `status` (text): "Pending"
   - `source_topic` (text): "Dosen"
   - `supervisor1Id` (text): "123"
   - `supervisor2Id` (text): "456"
   - `finalProjectPeriodId` (text): "789"
   - `members` (text): `[{"email":"test@example.com","title":"Test Title","resume":"Test Resume","student":{"id":1}}]`
   - `draft_path_0` (file): Pilih file PDF/DOC
   - `dispen_path_0` (file): Pilih file PDF/DOC
5. Tambahkan Authorization header dengan Bearer token
6. Klik Send

## Catatan Penting

- Index dimulai dari 0 (member pertama = 0, member kedua = 1, dst.)
- Files disimpan di `uploads/final-projects/drafts/` dan `uploads/final-projects/dispen/`
- Nama file otomatis di-generate dengan timestamp untuk mencegah konflik
- Semua operasi file dibungkus dalam database transaction untuk integritas data
- Jika ada error saat upload file, transaction akan di-rollback otomatis

## Perubahan dari Versi Sebelumnya

**Sebelumnya:**

```javascript
// ❌ CARA LAMA (tidak bekerja dengan baik)
formData.append("draft_path", file1);
formData.append("draft_path", file2);
```

**Sekarang:**

```javascript
// ✅ CARA BARU (lebih reliable)
formData.append("draft_path_0", file1);
formData.append("draft_path_1", file2);
```

Perubahan ini membuat mapping file ke member lebih akurat dan mencegah error "Cannot read properties of undefined".
