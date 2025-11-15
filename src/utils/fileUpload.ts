import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class FileUploadUtil {
  private uploadDir: string;
  private baseDir: string = "src/storages/";

  constructor() {
    this.uploadDir = path.join(process.cwd(), this.baseDir);
  }

  /**
   * Simpan file ke server dan return path-nya
   * @param file - File object dari multer atau File API
   * @param subDir - Subdirectory untuk menyimpan file (contoh: 'drafts', 'dispen')
   * @returns Path relatif file yang disimpan
   */
  async saveFile(
    file: Express.Multer.File | null,
    subDir: string
  ): Promise<string> {
    try {
      // Check if file is null or undefined
      if (!file) {
        throw new Error("File is null or undefined");
      }

      // Check if file has required properties
      if (!file.originalname || !file.buffer) {
        throw new Error(
          "File object is missing required properties (originalname or buffer)"
        );
      }

      // Buat direktori jika belum ada
      const targetDir = path.join(this.uploadDir, subDir);
      await this.ensureDirectoryExists(targetDir);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedOriginalName = this.sanitizeFilename(file.originalname);
      const filename = `${timestamp}-${sanitizedOriginalName}`;
      const filePath = path.join(targetDir, filename);

      // Simpan file
      await writeFile(filePath, file.buffer);

      // Return path relatif untuk disimpan di database
      return path.join(subDir, filename).replace(/\\/g, "/");
    } catch (error) {
      throw new Error(
        `Failed to save file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Simpan multiple files
   * @param file - File object
   * @param subDir - Subdirectory
   * @returns Path relatif file
   */
  async saveMultipleFiles(
    files: Express.Multer.File[],
    subDir: string
  ): Promise<string[]> {
    const savedPaths: string[] = [];

    for (const file of files) {
      const filePath = await this.saveFile(file, subDir);
      savedPaths.push(filePath);
    }

    return savedPaths;
  }

  /**
   * Pastikan direktori exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  /**
   * Sanitize filename untuk keamanan
   */
  sanitizeFilename(filename: string): string {
    // Remove path traversal attempts dan karakter berbahaya
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .substring(0, 50); // Limit length
  }

  /**
   * Byte to MB converter
   */
  bytesToMB(bytes: number): any {
    return (bytes / (1024 * 1024)).toFixed(2); // 2 angka di belakang koma
  }

  /**
   * Delete file dari server
   * @param filePath - Path relatif file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        await promisify(fs.unlink)(fullPath);
      }
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  }

  /**
   * Get full path dari relative path
   */
  getFullPath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }
}

export default new FileUploadUtil();
