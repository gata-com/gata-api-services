import { Router } from "express";
import { pendaftaranTA } from "../controllers/mahasiswa/pendaftaranTAController";
import { upload } from "../middleware/upload";

const router = Router();

router.post(
  "/pendaftaran-ta",
  upload.fields([
    { name: "thesisDraft", maxCount: 1 },
    { name: "supportingFile", maxCount: 1 },
    { name: "exemptionLetter", maxCount: 1 },
  ]),
  pendaftaranTA
);

export default router;
