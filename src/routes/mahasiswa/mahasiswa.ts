import { Router } from "express";
import { daftarTA } from "../../controllers/mahasiswa/pendaftaranTAController";
import { upload } from "../../middleware/upload";
import { auth, studentAuth } from "../../middleware/auth";
// import profileRoutes from "./mahasiswa/profile"; // Removed unused import

const router = Router();

router.post(
  "/daftar-ta",
  auth,
  studentAuth,
  upload.fields([
    { name: "draftTA", maxCount: 1 },
    { name: "filePendukung", maxCount: 1 },
    { name: "suratDispensasi", maxCount: 1 },
  ]),
  daftarTA
);

export default router;
