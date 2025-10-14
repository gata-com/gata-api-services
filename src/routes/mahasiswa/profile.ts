// routes/mahasiswa/profile.ts
import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  changePassword,
  getStatusPengajuan,
  requestPembimbingChange,
} from "../../controllers/mahasiswa/profileController";
import { auth } from "../../middleware/auth";

const router = Router();

// Semua route memerlukan authentication
router.use(auth);

// Profile data
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Profile picture
// router.post(
//   "/profile/picture",
//   upload.single("profilePicture"),
//   uploadProfilePicture
// );
router.delete("/profile/picture", deleteProfilePicture);

// Password
router.put("/profile/password", changePassword);

// Status pengajuan
router.get("/profile/status-pengajuan", getStatusPengajuan);

// Pembimbing change request
router.post("/profile/request-pembimbing-change", requestPembimbingChange);

export default router;
