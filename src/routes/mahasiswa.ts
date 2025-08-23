import { Router } from "express";
import { daftarTA } from "../controllers/mahasiswa/pendaftaranTAController";
import { upload } from "../middleware/upload";

const router = Router();

router.post(
  "/daftar-ta",
  upload.fields([
    { name: "draftTA", maxCount: 1 },
    { name: "filePendukung", maxCount: 1 },
    { name: "suratDispensasi", maxCount: 1 },
  ]),
  daftarTA
);

export default router;
