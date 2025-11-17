import multer from "multer";

// Konfigurasi multer dengan memory storage
// File akan disimpan di memory buffer dulu, baru nanti disimpan ke disk
const storage = multer.memoryStorage();

// Konfigurasi multer
const upload = multer({
  storage: storage,
  fileFilter: (req: any, file: any, cb: any) => {
    // Hanya izinkan file PDF
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimum 50MB per file
  },
});

// Export berbagai konfigurasi upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

// Export default untuk custom usage
export default upload;
