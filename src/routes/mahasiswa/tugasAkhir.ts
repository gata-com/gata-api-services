import { Router } from "express";

import { getStudentByQuery } from "../../controllers/mahasiswa/tugasAkhir/getStudentByQuery";
import { getLecturer } from "../../controllers/mahasiswa/tugasAkhir/getLecturer";
import { create } from "../../controllers/mahasiswa/tugasAkhir/createFinalProject";
import upload from "../../middleware/upload";

const router = Router();

// get data mahasiswa by query (e.g., email)
router.get("/", getStudentByQuery);
router.get("/dosen", getLecturer);

// Upload fields untuk multiple members, setiap member bisa punya draft_path dan dispen_path
// Gunakan .any() untuk menerima semua field dengan nama dinamis (draft_path_0, dispen_path_0, dll)
router.post("/daftar", upload.any(), create);

export default router;
