import multer from "multer";

// Konfigurasi multer dengan memory storage
// File akan disimpan di memory buffer dulu, baru nanti disimpan ke disk
const storage = multer.memoryStorage();

// Konfigurasi multer
const upload = multer({
  storage: storage,
});

// Export berbagai konfigurasi upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

// Export default untuk custom usage
export default upload;
