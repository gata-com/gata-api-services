// controllers/mahasiswa/pendaftaranTA.ts
import { Request, Response } from "express";
import { createPendaftaranTA } from "../../services/pendaftaranTAService";
import { TAType, TAStatus, SumberTopik } from "../../entities/pendaftaranTA";
import path from "path";
import fs from "fs/promises";

interface MulterFiles {
  draftTA?: Express.Multer.File[];
  filePendukung?: Express.Multer.File[];
  suratDispensasi?: Express.Multer.File[];
}

export const daftarTA = async (req: Request, res: Response) => {
  try {
    const {
      mahasiswaPendaftarId,
      anggotaTA: anggotaTAString, // Akan berupa JSON string dari FormData
      tipeTA,
      jumlahAnggota,
      judul,
      statusTA,
      resumeKebaharuan,
      dosenPembimbing1,
      dosenPembimbing2,
      sumberTopik,
    } = req.body;

    const files = req.files as MulterFiles;

    // Parse anggotaTA dari JSON string
    let anggotaTA;
    try {
      anggotaTA = JSON.parse(anggotaTAString);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Format data anggota TA tidak valid (harus berupa JSON)"
      });
    }

    // Validasi field wajib
    if (!mahasiswaPendaftarId || !anggotaTA || !tipeTA || !judul || !statusTA || !resumeKebaharuan || !dosenPembimbing1 || !sumberTopik) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi (kecuali dosenPembimbing2 dan file pendukung opsional).",
      });
    }

    // Validasi anggotaTA harus array
    if (!Array.isArray(anggotaTA)) {
      return res.status(400).json({
        success: false,
        message: "Data anggota TA harus berupa array"
      });
    }

    // Validasi enum values
    if (!(Object.values(TAType) as string[]).includes(tipeTA)) {
      return res.status(400).json({ success: false, message: "Tipe TA tidak valid" });
    }

    if (!(Object.values(TAStatus) as string[]).includes(statusTA)) {
      return res.status(400).json({ success: false, message: "Status TA tidak valid" });
    }

    if (!(Object.values(SumberTopik) as string[]).includes(sumberTopik)) {
      return res.status(400).json({ success: false, message: "Sumber topik tidak valid" });
    }

    // Validasi jumlah anggota
    const jumlahAnggotaNum = parseInt(jumlahAnggota);
    if (tipeTA === TAType.REGULER) {
      if (jumlahAnggotaNum !== 1) {
        return res.status(400).json({
          success: false,
          message: "TA Reguler harus memiliki 1 anggota"
        });
      }
    } else if (tipeTA === TAType.CAPSTONE) {
      if (jumlahAnggotaNum < 2 || jumlahAnggotaNum > 3) {
        return res.status(400).json({
          success: false,
          message: "TA Capstone harus memiliki 2-3 anggota"
        });
      }
    }

    // Validasi data anggota TA
    if (anggotaTA.length !== jumlahAnggotaNum) {
      return res.status(400).json({
        success: false,
        message: `Jumlah data anggota harus sesuai dengan jumlah anggota yang dipilih (${jumlahAnggotaNum})`
      });
    }

    // Validasi setiap anggota TA memiliki data yang lengkap
    for (let i = 0; i < anggotaTA.length; i++) {
      const anggota = anggotaTA[i];
      if (!anggota.mahasiswaId || !anggota.urutan) {
        return res.status(400).json({
          success: false,
          message: `Data anggota ke-${i + 1} tidak lengkap (mahasiswaId dan urutan wajib diisi)`
        });
      }
      
      // Validasi urutan sesuai dengan index
      if (anggota.urutan !== i + 1) {
        return res.status(400).json({
          success: false,
          message: `Urutan anggota ke-${i + 1} harus ${i + 1}`
        });
      }
    }

    // Validasi file draft TA (wajib)
    if (!files?.draftTA || files.draftTA.length === 0) {
      return res.status(400).json({
        success: false,
        message: "File draft TA wajib diupload"
      });
    }

    // Validasi surat dispensasi hanya jika status dispensasi
    if (statusTA === TAStatus.DISPENSASI) {
      if (!files?.suratDispensasi || files.suratDispensasi.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Surat dispensasi wajib diupload untuk status dispensasi"
        });
      }
    }

    // Validasi resume kebaharuan minimal (misal minimal 500 karakter untuk 5 jurnal)
    if (resumeKebaharuan.length < 500) {
      return res.status(400).json({
        success: false,
        message: "Resume kebaharuan minimal 500 karakter (ringkasan dari 5 jurnal pembanding)"
      });
    }

    // Setup direktori upload
    const uploadDir = path.join(__dirname, "../../../uploads/ta");
    await fs.mkdir(uploadDir, { recursive: true });

    // Function untuk save file dengan nama format yang benar
    const saveFile = async (file: Express.Multer.File, prefix: string): Promise<string> => {
      // Ambil NIM dan nama dari mahasiswa pendaftar
      const fileName = `${mahasiswaPendaftarId}_${prefix}_${Date.now()}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      
      await fs.writeFile(filePath, file.buffer);
      return `uploads/ta/${fileName}`;
    };

    // Save files
    let draftTAPath: string | undefined;
    let filePendukungPath: string | undefined;
    let suratDispensasiPath: string | undefined;

    // Save draft TA (wajib)
    if (files.draftTA && files.draftTA[0]) {
      draftTAPath = await saveFile(files.draftTA[0], "DRAFT");
    }

    // Save file pendukung (opsional)
    if (files.filePendukung && files.filePendukung[0]) {
      filePendukungPath = await saveFile(files.filePendukung[0], "PENDUKUNG");
    }

    // Save surat dispensasi (hanya jika status dispensasi)
    if (statusTA === TAStatus.DISPENSASI && files.suratDispensasi && files.suratDispensasi[0]) {
      suratDispensasiPath = await saveFile(files.suratDispensasi[0], "DISPENSASI");
    }

    // Create pendaftaran TA
    const result = await createPendaftaranTA({
      mahasiswaPendaftarId: parseInt(mahasiswaPendaftarId),
      anggotaTA: anggotaTA.map((anggota: any) => ({
        mahasiswaId: parseInt(anggota.mahasiswaId),
        urutan: parseInt(anggota.urutan)
      })),
      tipeTA,
      jumlahAnggota: jumlahAnggotaNum,
      judul,
      statusTA,
      resumeKebaharuan,
      dosenPembimbing1,
      dosenPembimbing2,
      sumberTopik,
      draftTAPath,
      filePendukungPath,
      suratDispensasiPath,
    });

    return res.status(201).json({
      success: true,
      message: "Pendaftaran TA berhasil",
      data: result,
    });

  } catch (err: any) {
    // Cleanup files jika terjadi error
    // (implementasi cleanup bisa ditambahkan di sini)
    
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Terjadi kesalahan internal server"
    });
  }
};